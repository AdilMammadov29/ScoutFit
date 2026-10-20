import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { bulutaBaglan, bulutuDurdur } from "@/lib/sync";
import { AuthView } from "./auth";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        void bulutaBaglan(session.user.id);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
      if (session?.user) {
        void bulutaBaglan(session.user.id);
      } else {
        bulutuDurdur();
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

  // Kullanıcı giriş yapmamışsa şık açık renkli Supabase destekli AuthView gösterilir
  if (!session) {
    return <AuthView />;
  }

  // Giriş yapılmışsa doğrudan ana uygulamaya (dashboard/shell) geçilir
  return <>{children}</>;
}