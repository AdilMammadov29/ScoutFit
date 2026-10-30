import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AuthView } from "@/components/auth";
import { OnboardingView } from "@/components/onboarding";
import { useAuth } from "@/lib/authStore";
import { useFit } from "@/lib/store";
import { bulutaBaglan, bulutuDurdur } from "@/lib/sync";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncTamamlandi, setSyncTamamlandi] = useState(false);
  const [userOnboardingDone, setUserOnboardingDone] = useState(false);

  const profil = useFit((s) => s.profil);

  const syncZustandAndCloud = async (supabaseSession: any) => {
    if (!supabaseSession?.user) return;

    const user = supabaseSession.user;
    const authStore = useAuth.getState();
    const displayName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Sporcu";

    let existing = authStore.accounts.find((a: any) => a.id === user.id);
    if (!existing) {
      existing = { id: user.id, name: displayName };
      useAuth.setState({ accounts: [...authStore.accounts, existing] });
    }
    useAuth.setState({ currentUser: existing });

    // Kullanıcıya özel onboarding durumunu kontrol et
    try {
      const isDone = localStorage.getItem(`scoutfit_onboarding_${user.id}`) === "true";
      setUserOnboardingDone(isDone);
    } catch {
      setUserOnboardingDone(false);
    }

    try {
      await bulutaBaglan(user.id);
    } catch (err) {
      console.error("Bulut senkronizasyonu hatası:", err);
    } finally {
      setSyncTamamlandi(true);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Mevcut session kontrolü
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      if (initialSession) {
        await syncZustandAndCloud(initialSession);
      }
      setLoading(false);
    });

    // 2. Auth durumu değişim dinleyicisi
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !newSession) {
        bulutuDurdur();
        useAuth.getState().logout?.();

        // Tip hatası vermemesi için güvenli Zustand sıfırlama
        const fitStore = useFit.getState() as any;
        if (typeof fitStore.reset === "function") {
          fitStore.reset();
        } else if (fitStore.setProfil) {
          fitStore.setProfil(undefined);
        }

        setSession(null);
        setUserOnboardingDone(false);
        setSyncTamamlandi(false);
      } else if (newSession) {
        setSession(newSession);
        await syncZustandAndCloud(newSession);
        if (typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      setLoading(false);
    });

    // 3. Android Deep Link dinleyicisi (Google Callback)
    let appUrlListener: any = null;
    if (Capacitor.isNativePlatform()) {
      appUrlListener = App.addListener("appUrlOpen", async (event) => {
        if (event.url.includes("scoutfit://auth/callback") || event.url.includes("scoutfit://")) {
          try {
            await Browser.close();
          } catch (_) {}

          const rawHash = event.url.split("#")[1] || "";
          const rawQuery = event.url.split("?")[1] || "";
          const hashParams = new URLSearchParams(rawHash);
          const queryParams = new URLSearchParams(rawQuery);

          const accessToken = hashParams.get("access_token") || queryParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token") || queryParams.get("refresh_token");
          const code = queryParams.get("code") || hashParams.get("code");

          if (accessToken && refreshToken) {
            const { data } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (data.session && isMounted) {
              setSession(data.session);
              await syncZustandAndCloud(data.session);
            }
          } else if (code) {
            const { data } = await supabase.auth.exchangeCodeForSession(code);
            if (data.session && isMounted) {
              setSession(data.session);
              await syncZustandAndCloud(data.session);
            }
          }
        }
      });
    }

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      if (appUrlListener) {
        appUrlListener.remove();
      }
    };
  }, []);

  if (loading || (session && !syncTamamlandi)) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="h-6 w-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  // Oturum yoksa Login ekranı
  if (!session) {
    return <AuthView />;
  }

  // 169. satır düzeltmesi: profil.userId yerine doğrudan kullanıcıya özel onboarding bayrağı
  // veya bulut senkronizasyonu tamamlanmış geçerli profil varlığı
  const profilVar =
    userOnboardingDone ||
    (profil &&
      typeof (profil as any).boy === "number" &&
      (profil as any).boy > 50 &&
      typeof (profil as any).kilo === "number" &&
      (profil as any).kilo > 20);

  if (!profilVar) {
    return (
      <OnboardingView
        onComplete={() => {
          if (session?.user?.id) {
            try {
              localStorage.setItem(`scoutfit_onboarding_${session.user.id}`, "true");
            } catch {}
          }
          setUserOnboardingDone(true);
        }}
      />
    );
  }

  return <>{children}</>;
}

export default AuthGate;