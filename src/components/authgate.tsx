import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal ve Form State'leri
  const [modalAcik, setModalAcik] = useState(false);
  const [isLogin, setIsLogin] = useState(true); // true = Giriş, false = Kayıt
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreOnay, setSifreOnay] = useState("");
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

    // KAYIT OLUNUYORSA VE ŞİFRELER EŞLEŞMİYORSA DURDUR
    if (!isLogin && sifre !== sifreOnay) {
      return setMesaj("Şifreler birbiriyle uyuşmuyor!");
    }

    setIslemde(true);
    setMesaj("Buluta bağlanıyor...");

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password: sifre });
      if (error) setMesaj("Giriş başarısız: " + error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password: sifre });
      if (error) setMesaj("Kayıt hatası: " + error.message);
      else setMesaj("Hesap oluşturuldu, giriş yapılıyor...");
    }
    setIslemde(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#121212] text-white">Yükleniyor...</div>;

  // GİRİŞ YAPILMADIYSA MODERN SİYAH EKRAN VE POPUP GÖSTERİLİR
  if (!session) {
    return (
      <div className="relative min-h-screen overflow-y-auto bg-[#121212] text-white selection:bg-[#6f9f87] selection:text-white">
        {/* ARKA PLAN EFEKTLERİ */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-[90vw] max-w-7xl rounded-full bg-gradient-to-tr from-[#6f9f87]/15 via-[#b39573]/10 to-transparent blur-[140px] pointer-events-none animate-pulse"></div>
        <div className="absolute top-[800px] right-10 h-[500px] w-[500px] rounded-full bg-[#6f9f87]/10 blur-[120px] pointer-events-none"></div>

        {/* ÜST NAVBAR */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-white/10 bg-[#121212]/60 px-8 py-5 backdrop-blur-xl transition-all">
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl font-extrabold tracking-tight text-[#6f9f87] drop-shadow-sm">ScoutFit</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setModalAcik(true); setIsLogin(true); setMesaj(""); }}
              className="rounded-2xl px-5 py-2.5 text-xs font-semibold tracking-wide text-white transition-all hover:bg-white/5"
            >
              Giriş Yap
            </button>
            <button
              onClick={() => { setModalAcik(true); setIsLogin(false); setMesaj(""); }}
              className="rounded-2xl bg-[#6f9f87] px-6 py-2.5 text-xs font-semibold tracking-wide text-white shadow-lg shadow-[#6f9f87]/25 transition-all hover:scale-105"
            >
              Hesap Aç
            </button>
          </div>
        </header>

        {/* ANA İÇERİK (LANDING PAGE) */}
        <main className="relative px-6 pt-24 pb-36">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#6f9f87]/20 bg-[#6f9f87]/10 px-5 py-2 text-xs font-semibold text-[#6f9f87] mb-8 shadow-sm backdrop-blur-md animate-bounce">
              <span>🚀</span> Yeni Nesil Kişisel Fitness & Akıllı Beslenme Asistanı
            </div>
            <h1 className="font-display text-6xl font-black tracking-tight sm:text-8xl text-white leading-[1.05]">
              Sınırlarını <span className="bg-gradient-to-r from-[#6f9f87] to-[#b39573] bg-clip-text text-transparent">ScoutFit</span> ile Yeniden Tanımla.
            </h1>
            <p className="mt-8 text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto font-normal">
              Standart listelere veda et. Yapay zeka koçunla antrenmanlarını optimize et, kaçamaklarını bütçene göre esnet ve çoklu hesap desteğiyle zirveye oyna.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <button
                onClick={() => { setModalAcik(true); setIsLogin(false); setMesaj(""); }}
                className="rounded-2xl bg-[#6f9f87] px-10 py-5 text-base font-semibold text-white shadow-2xl shadow-[#6f9f87]/30 transition-all hover:scale-105 hover:shadow-[#6f9f87]/40"
              >
                Hemen Ücretsiz Başla
              </button>
            </div>
          </div>
        </main>

        {/* GİRİŞ / KAYIT MODALI (O İSTEDİĞİN İKİ ŞİFRELİ EKRAN) */}
        {modalAcik && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#1a1a1a] p-8 shadow-2xl text-left relative">
              <button
                onClick={() => setModalAcik(false)}
                className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                ✕
              </button>

              <h2 className="text-2xl font-bold text-white mb-2 text-center">
                {isLogin ? "Tekrar Hoş Geldin" : "Yeni Hesap Oluştur"}
              </h2>
              <p className="text-xs text-gray-400 mb-6 text-center">
                {isLogin ? "Antrenmanlarına kaldığın yerden devam et." : "ScoutFit'e katılmak için bilgilerini gir."}
              </p>

              <form onSubmit={devamEt} className="flex flex-col gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">E-Posta Adresi</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Örn: mail@adresin.com"
                    className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-all focus:border-[#6f9f87] focus:ring-1 focus:ring-[#6f9f87]"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Şifre</label>
                  <input
                    type="password"
                    value={sifre}
                    onChange={(e) => setSifre(e.target.value)}
                    placeholder="••••••"
                    className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-all focus:border-[#6f9f87] focus:ring-1 focus:ring-[#6f9f87]"
                  />
                </div>

                {/* SADECE KAYIT OLURKEN ŞİFRE ONAYI İSTER */}
                {!isLogin && (
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-400">Şifreyi Onayla</label>
                    <input
                      type="password"
                      value={sifreOnay}
                      onChange={(e) => setSifreOnay(e.target.value)}
                      placeholder="••••••"
                      className="min-h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white outline-none transition-all focus:border-[#6f9f87] focus:ring-1 focus:ring-[#6f9f87]"
                    />
                  </div>
                )}

                {mesaj && (
                  <div className={`rounded-2xl border p-3 text-center text-xs font-medium ${mesaj.includes("hata") || mesaj.includes("uyuşmuyor") || mesaj.includes("gerekli") || mesaj.includes("başarısız") ? "border-red-500/30 bg-red-500/10 text-red-400" : "border-[#6f9f87]/30 bg-[#6f9f87]/10 text-[#6f9f87]"}`}>
                    {mesaj}
                  </div>
                )}

                <div className="pt-2">
                  <button type="submit" className="w-full rounded-2xl bg-[#6f9f87] px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#5a826e]">
                    {islemde ? "Bekleniyor..." : (isLogin ? "Giriş Yap" : "Kayıt Ol")}
                  </button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => { setIsLogin(!isLogin); setMesaj(""); }}
                  className="text-xs font-medium text-gray-400 hover:text-[#6f9f87] transition-colors"
                >
                  {isLogin ? "Hesabın yok mu? Yeni kayıt oluştur" : "Zaten hesabın var mı? Giriş yap"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // GİRİŞ BAŞARILIYSA İÇERİYE (SHELL) AL
  return <>{children}</>;
}