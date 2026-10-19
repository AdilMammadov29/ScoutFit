import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [mesaj, setMesaj] = useState("");
  const [islemde, setIslemde] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const devamEt = async (e: React.FormEvent) => {
    e.preventDefault();
    setMesaj("");

    if (!email.trim() || sifre.length < 6) {
      return setMesaj("E-posta ve en az 6 haneli şifre gerekli.");
    }

    setIslemde(true);
    setMesaj("Buluta bağlanıyor...");

    const { error } = await supabase.auth.signInWithPassword({ email, password: sifre });

    if (error) {
      if (error.message.includes("Invalid login") || error.message.includes("not found") || error.message.includes("Invalid credentials")) {
        const { error: regErr } = await supabase.auth.signUp({ email, password: sifre });
        if (regErr) {
          setMesaj("Hata: " + regErr.message);
        } else {
          setMesaj("Hesabın açıldı, içeri alınıyorsun...");
        }
      } else {
        setMesaj("Hata: " + error.message);
      }
    }
    setIslemde(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#121212] text-white">Yükleniyor...</div>;

  // GİRİŞ YAPILMAMIŞSA, EKRANIN TAM ORTASINDA DOĞRUDAN MAİL VE ŞİFRE SORAN KUTU GÖSTER
  if (!session) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#121212] text-white p-4 selection:bg-[#6f9f87] selection:text-white">
        {/* ARKA PLAN EFEKTLERİ */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-[90vw] max-w-7xl rounded-full bg-gradient-to-tr from-[#6f9f87]/15 via-[#b39573]/10 to-transparent blur-[140px] pointer-events-none animate-pulse"></div>

        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1a1a] p-8 shadow-2xl text-left relative z-10">
          <div className="text-center mb-6">
            <span className="font-display text-4xl font-extrabold tracking-tight text-[#6f9f87]">ScoutFit</span>
            <h2 className="text-xl font-bold text-white mt-3">Antrenman Defterine Giriş</h2>
            <p className="text-xs text-gray-400 mt-1">E-postanı ve şifreni yaz. Kayıtlı değilsen otomatik açılır.</p>
          </div>

          <form onSubmit={devamEt} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">E-Posta Adresi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mail@adresin.com"
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-all focus:border-[#6f9f87] focus:ring-1 focus:ring-[#6f9f87]"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Şifre (Min 6 hane)</label>
              <input
                type="password"
                value={sifre}
                onChange={(e) => setSifre(e.target.value)}
                placeholder="••••••"
                className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-all focus:border-[#6f9f87] focus:ring-1 focus:ring-[#6f9f87]"
              />
            </div>

            {mesaj && (
              <div className={`rounded-2xl border p-3 text-center text-xs font-medium ${mesaj.includes("hata") || mesaj.includes("gerekli") ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-[#6f9f87]/30 bg-[#6f9f87]/10 text-[#6f9f87]"}`}>
                {mesaj}
              </div>
            )}

            <div className="pt-2">
              <button type="submit" className="w-full rounded-2xl bg-[#6f9f87] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#5a826e]">
                {islemde ? "Bağlanıyor..." : "Giriş Yap / Başla"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // GİRİŞ BAŞARILIYSA UYGULAMAYA GEÇ
  return <>{children}</>;
}