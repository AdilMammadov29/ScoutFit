import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Btn, Panel } from "./ui";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal ve Form State'leri
  const [modalAcik, setModalAcik] = useState(false);
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
      return setMesaj("E-posta gerekli ve şifre en az 6 hane olmalıdır.");
    }

    setIslemde(true);
    setMesaj("Buluta bağlanıyor...");

    const { error } = await supabase.auth.signInWithPassword({ email, password: sifre });

    if (error) {
      if (error.message.includes("Invalid login") || error.message.includes("not found") || error.message.includes("Invalid credentials")) {
        const { error: regErr } = await supabase.auth.signUp({ email, password: sifre });
        if (regErr) {
          setMesaj("Kayıt hatası: " + regErr.message);
        } else {
          setMesaj("Hesap oluşturuldu, içeri alınıyorsun...");
        }
      } else {
        setMesaj("Hata: " + error.message);
      }
    }
    setIslemde(false);
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Yükleniyor...</div>;

  // EĞER GİRİŞ YAPILMAMIŞSA, SENİN SİYAH EKRANIN GÖSTERİLİR
  if (!session) {
    return (
      <div className="relative min-h-screen overflow-y-auto bg-paper text-ink selection:bg-pine selection:text-paper">
        {/* --- DERİNLİK VE ARKA PLAN EFEKTLERİ --- */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-[90vw] max-w-7xl rounded-full bg-gradient-to-tr from-pine/15 via-clay/10 to-transparent blur-[140px] pointer-events-none animate-pulse"></div>
        <div className="absolute top-[800px] right-10 h-[500px] w-[500px] rounded-full bg-pine/10 blur-[120px] pointer-events-none"></div>

        {/* --- ÜST NAVBAR --- */}
        <header className="sticky top-0 z-50 flex items-center justify-between border-b border-line/60 bg-paper/60 px-8 py-5 backdrop-blur-xl transition-all">
          <div className="flex items-center gap-2">
            <span className="font-display text-3xl font-extrabold tracking-tight text-pine drop-shadow-sm">ScoutFit</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setModalAcik(true); setMesaj(""); }}
              className="rounded-2xl bg-pine px-6 py-2.5 text-xs font-semibold tracking-wide text-paper shadow-lg shadow-pine/25 transition-all hover:scale-105 active:scale-95"
            >
              Giriş Yap / Kayıt Ol
            </button>
          </div>
        </header>

        {/* --- ANA İÇERİK --- */}
        <main className="relative px-6 pt-24 pb-36">
          <div className="mx-auto max-w-5xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-pine/20 bg-pine/5 px-5 py-2 text-xs font-semibold text-pine mb-8 shadow-sm backdrop-blur-md animate-bounce">
              <span>🚀</span> Yeni Nesil Kişisel Fitness & Akıllı Beslenme Asistanı
            </div>
            <h1 className="font-display text-6xl font-black tracking-tight sm:text-8xl text-ink leading-[1.05]">
              Sınırlarını <span className="text-pine bg-gradient-to-r from-pine to-clay bg-clip-text text-transparent">ScoutFit</span> ile Yeniden Tanımla.
            </h1>
            <p className="mt-8 text-xl text-muted leading-relaxed max-w-2xl mx-auto font-normal">
              Standart listelere veda et. Yapay zeka koçunla antrenmanlarını optimize et, kaçamaklarını bütçene göre esnet ve çoklu hesap desteğiyle zirveye oyna.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <button
                onClick={() => { setModalAcik(true); setMesaj(""); }}
                className="rounded-2xl bg-pine px-10 py-5 text-base font-semibold text-paper shadow-2xl shadow-pine/30 transition-all hover:scale-105 hover:shadow-pine/40 active:scale-95"
              >
                Hemen Ücretsiz Başla
              </button>
            </div>
          </div>

          {/* İSTATİSTİK ŞERİDİ */}
          <div className="mx-auto mt-28 max-w-5xl grid grid-cols-2 gap-6 sm:grid-cols-4 rounded-3xl border border-line/60 bg-cream/50 p-8 backdrop-blur-xl shadow-xl text-center">
            <div className="transition-transform hover:scale-105">
              <div className="font-display text-4xl font-black text-pine">Kalori</div>
              <div className="text-xs font-medium text-muted mt-2 uppercase tracking-wider">Günlük Enerji & BMR</div>
            </div>
            <div className="transition-transform hover:scale-105">
              <div className="font-display text-4xl font-black text-pine">Makro</div>
              <div className="text-xs font-medium text-muted mt-2 uppercase tracking-wider">Protein, Karb & Yağ</div>
            </div>
            <div className="transition-transform hover:scale-105">
              <div className="font-display text-4xl font-black text-pine">Hedef</div>
              <div className="text-xs font-medium text-muted mt-2 uppercase tracking-wider">Kilo Al / Ver / Koru</div>
            </div>
            <div className="transition-transform hover:scale-105">
              <div className="font-display text-4xl font-black text-pine">Esnek</div>
              <div className="text-xs font-medium text-muted mt-2 uppercase tracking-wider">Kaçamak & Öğün Analizi</div>
            </div>
          </div>

          {/* Özellikler Grid */}
          <div className="mx-auto mt-28 grid max-w-5xl gap-8 sm:grid-cols-3">
            <div className="group rounded-3xl border border-line/80 bg-cream/80 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-pine/50 hover:shadow-2xl hover:shadow-pine/10">
              <div className="mb-6 inline-flex rounded-2xl bg-paper p-4 text-3xl shadow-sm group-hover:scale-110 transition-transform">🧠</div>
              <h3 className="font-display text-xl font-bold text-ink">Akıllı Koç & Esnek Öğün</h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">"Bugün cips yiyebilir miyim?" diye sor, yapay zeka kalori bütçene göre anında analiz edip yol göstersin.</p>
            </div>
            <div className="group rounded-3xl border border-line/80 bg-cream/80 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-pine/50 hover:shadow-2xl hover:shadow-pine/10">
              <div className="mb-6 inline-flex rounded-2xl bg-paper p-4 text-3xl shadow-sm group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="font-display text-xl font-bold text-ink">Çoklu Güvenli Profil</h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">Aynı cihazda şifre korumalı 3 adede kadar farklı profil aç, verilerin birbirine asla karışmasın.</p>
            </div>
            <div className="group rounded-3xl border border-line/80 bg-cream/80 p-8 transition-all duration-300 hover:-translate-y-2 hover:border-pine/50 hover:shadow-2xl hover:shadow-pine/10">
              <div className="mb-6 inline-flex rounded-2xl bg-paper p-4 text-3xl shadow-sm group-hover:scale-110 transition-transform">📊</div>
              <h3 className="font-display text-xl font-bold text-ink">Gelişmiş Gelişim Takibi</h3>
              <p className="mt-3 text-sm text-muted leading-relaxed">Kilo geçmişin, antrenman bölgelerin ve tüm istatistiklerin tek ekranda modern grafiklerle elinin altında.</p>
            </div>
          </div>
        </main>

        {/* --- TEKLİ GİRİŞ / KAYIT MODALI (POPUP) --- */}
        {modalAcik && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-md animate-fade-in">
            <div className="w-full max-w-md scale-100 transition-transform">
              <Panel>
                <div className="relative p-8">
                  <button
                    onClick={() => setModalAcik(false)}
                    className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-cream text-sm text-muted hover:text-ink transition-colors"
                  >
                    ✕
                  </button>

                  <h2 className="font-display text-3xl font-extrabold text-ink mb-2">
                    Hoş Geldin
                  </h2>
                  <p className="text-xs text-muted mb-6">
                    E-posta ve şifrenle giriş yap. Hesabın yoksa senin için otomatik oluşturacağız.
                  </p>

                  <form onSubmit={devamEt} className="flex flex-col gap-4">
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">E-Posta Adresi</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Örn: mail@adresin.com"
                        className="min-h-12 w-full rounded-2xl border border-line bg-cream px-4 text-sm text-ink outline-none transition-all focus:border-pine focus:ring-2 focus:ring-pine/20"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Şifre (En az 6 hane)</label>
                      <input
                        type="password"
                        value={sifre}
                        onChange={(e) => setSifre(e.target.value)}
                        placeholder="••••••"
                        className="min-h-12 w-full rounded-2xl border border-line bg-cream px-4 text-sm text-ink outline-none transition-all focus:border-pine focus:ring-2 focus:ring-pine/20"
                      />
                    </div>

                    {mesaj && (
                      <div className={`rounded-2xl border p-4 text-center text-xs font-medium ${mesaj.includes("hata") || mesaj.includes("gerekli") ? "border-clay/30 bg-clay/10 text-clay" : "border-pine/30 bg-pine/10 text-pine"}`}>
                        {mesaj}
                      </div>
                    )}

                    <div className="pt-3">
                      <Btn type="submit">
                        {islemde ? "İşleniyor..." : "Giriş Yap / Kayıt Ol"}
                      </Btn>
                    </div>
                  </form>
                </div>
              </Panel>
            </div>
          </div>
        )}
      </div>
    );
  }

  // EĞER GİRİŞ BAŞARILIYSA, UYGULAMANIN İÇİNE AL
  return <>{children}</>;
}