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
  
  // Yerel hafızadaki kalıcı tamamlanma durumu
  const [onboardingBittiLocal, setOnboardingBittiLocal] = useState<boolean>(() => {
    try {
      return localStorage.getItem("scoutfit_onboarding_done") === "true";
    } catch {
      return false;
    }
  });

  // Store'daki profil
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

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      if (session) {
        await syncZustandAndCloud(session);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);

      if (newSession) {
        await syncZustandAndCloud(newSession);
        if (typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname);
        }
      } else {
        bulutuDurdur();
        useAuth.getState().logout();
        setSyncTamamlandi(false);
      }

      setLoading(false);
    });

    let appUrlListener: any = null;
    if (Capacitor.isNativePlatform()) {
      appUrlListener = App.addListener("appUrlOpen", async (event) => {
        if (event.url.includes("scoutfit://auth/callback")) {
          try {
            await Browser.close();
          } catch (_) {}

          const cleanUrl = event.url.replace("#", "?");
          const urlObj = new URL(cleanUrl);
          const code = urlObj.searchParams.get("code");

          if (code) {
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

  // 1. Oturum yoksa Login ekranı
  if (!session) {
    return <AuthView />;
  }

  // 2. Profil kontrolü: Daha önce bitirildiyse VEYA store'da profil varsa direkt içeri al
  const profilVar =
    onboardingBittiLocal ||
    (profil && typeof profil.boy === "number" && profil.boy > 50 && typeof profil.kilo === "number" && profil.kilo > 20);

  if (!profilVar) {
    return (
      <OnboardingView
        onComplete={() => {
          try {
            localStorage.setItem("scoutfit_onboarding_done", "true");
          } catch {}
          setOnboardingBittiLocal(true);
        }}
      />
    );
  }

  // 3. Her şey tamam -> Ana uygulama ekranları
  return <>{children}</>;
}

export default AuthGate;