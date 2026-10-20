import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { bulutaBaglan, bulutuDurdur } from "@/lib/sync";
import { useAuth } from "@/lib/authStore";
import { AuthView } from "./auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        void bulutaBaglan(session.user.id);
        const emailName = session.user.email?.split("@")[0] || "Kullanıcı";
        (useAuth as any).setState({ currentUser: emailName });
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session?.user) {
        void bulutaBaglan(session.user.id);
        const emailName = session.user.email?.split("@")[0] || "Kullanıcı";
        (useAuth as any).setState({ currentUser: emailName });
      } else {
        bulutuDurdur();
        (useAuth as any).setState({ currentUser: null });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper text-ink">
        <div className="animate-pulse text-sm font-semibold text-pine">ScoutFit Yükleniyor...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthView />;
  }

  return <>{children}</>;
}