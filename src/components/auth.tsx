import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { bulutaBaglan } from "@/lib/sync";
import { Btn, Panel } from "./ui";

export function AuthView() {
  const [modalMod, setModalMod] = useState<"giris" | "kayit" | null>(null);
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreOnay, setSifreOnay] = useState("");
  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata("");
    setBasari("");

    if (!email.trim() || !sifre.trim()) {
      setHata("Lütfen tüm alanları doldur.");
      return;
    }

    if (sifre.length < 6) {
      setHata("Şifre en az 6 karakter olmalıdır.");
      return;
    }

    if (modalMod === "kayit" && sifre !== sifreOnay) {
      setHata("Şifreler birbiriyle uyuşmuyor.");
      return;
    }

    setYukleniyor(true);

    if (modalMod === "giris") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: sifre,
      });

      if (error) {
        setHata("Giriş başarısız: " + error.message);
      } else if (data.session?.user) {
        await bulutaBaglan(data.session.user.id);
        setModalMod(null);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: sifre,
      });

      if (error) {
        setHata("Kayıt oluşturulamadı: " + error.message);
      } else {
        setBasari("Hesap başarıyla oluşturuldu! Giriş yapılıyor...");
        if (data.session?.user) {
          await bulutaBaglan(data.session.user.id);
          setModalMod(null);
        } else {
          setModalMod("giris");
        }
      }
    }

    setYukleniyor(false);
  };

  return (
    <div className="relative min-h-screen overflow-y-auto bg-paper text-ink selection:bg-pine selection:text-paper">
      {/* ARKA PLAN EFEKTLERİ */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[700px] w-[90vw] max-w-7xl rounded-full bg-gradient-to-tr from-pine/15 via-clay/10 to-transparent blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute top-[800px] right-10 h-[500px] w-[500px] rounded-full bg-pine/10 blur-[120px] pointer-events-none"></div>

      {/* NAVBAR */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-line/60 bg-paper/60 px-8 py-5 backdrop-blur-xl transition-all">
        <div className="flex items-center gap-2">
          <span className="font-display text-3xl font-extrabold tracking-tight text-pine drop-shadow-sm">ScoutFit</span>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
            className="rounded-2xl bg-pine px-6 py-2.5 text-xs font-semibold tracking-wide text-paper shadow-lg shadow-pine/25 transition-all hover:scale-105 active:scale-95"
          >
            Giriş Yap / Kayıt Ol
          </button>
        </div>
      </header>

      {/* ANA İÇERİK */}
      <main className="relative px-6 pt-24 pb-36">
        <div className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-pine/20 bg-pine/5 px-5 py-2 text-xs font-semibold text-pine mb-8 shadow-sm backdrop-blur-md">
            <span>🚀</span> Yeni Nesil Kişisel Fitness & Akıllı Beslenme Asistanı
          </div>
          <h1 className="font-display text-6xl font-black tracking-tight sm:text-8xl text-ink leading-[1.05]">
            Sınırlarını <span className="text-pine bg-gradient-to-r from-pine to-clay bg-clip-text text-transparent">ScoutFit</span> ile Yeniden Tanımla.
          </h1>
          <p className="mt-8 text-xl text-muted leading-relaxed max-w-2xl mx-auto font-normal">
            Standart listelere veda et. Supabase bulut gücüyle antrenmanlarını ve beslenmeni her cihazda anında eşitle.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <button
              onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
              className="rounded-2xl bg-pine px-10 py-5 text-base font-semibold text-paper shadow-2xl shadow-pine/30 transition-all hover:scale-105 hover:shadow-pine/40 active:scale-95"
            >
              Hemen Başla
            </button>
          </div>
        </div>

        {/* İstatistik Şeridi */}
        <div className="mx-auto mt-28 max-w-5xl grid grid-cols-2 gap-6 sm:grid-cols-4 rounded-3xl border border-line/60 bg-cream/50 p-8 backdrop-blur-xl shadow-xl text-center">
          <div>
            <div className="font-display text-4xl font-black text-pine">Kalori</div>
            <div className="text-xs font-medium text-muted mt-2 uppercase tracking-wider">Günlük Enerji & BMR</div>
          </div>
          <div>
            <div className="font-display text-4xl font-black text-pine">Makro</div>
            <div className="text-xs font-medium text-muted mt-2 uppercase tracking-wider">Protein, Karb & Yağ</div>
          </div>
          <div>
            <div className="font-display text-4xl font-black text-pine">Hedef</div>
            <div className="text-xs font-medium text-muted mt-2 uppercase tracking-wider">Kilo Al / Ver / Koru</div>
          </div>
          <div>
            <div className="font-display text-4xl font-black text-pine">Bulut</div>
            <div className="text-xs font-medium text-muted mt-2 uppercase tracking-wider">Supabase Eşitleme</div>
          </div>
        </div>
      </main>

      {/* POPUP MODAL */}
      {modalMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <div className="w-full max-w-md">
            <Panel>
              <div className="relative p-7">
                <button
                  onClick={() => setModalMod(null)}
                  className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-full bg-cream text-sm text-muted hover:text-ink transition-colors"
                >
                  ✕
                </button>

                {/* SEKME DEĞİŞTİRİCİ */}
                <div className="mb-6 flex rounded-2xl bg-cream p-1 border border-line/60">
                  <button
                    type="button"
                    onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                      modalMod === "giris" ? "bg-pine text-paper shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    Giriş Yap
                  </button>
                  <button
                    type="button"
                    onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
                    className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                      modalMod === "kayit" ? "bg-pine text-paper shadow-sm" : "text-muted hover:text-ink"
                    }`}
                  >
                    Kayıt Ol
                  </button>
                </div>

                {basari && (
                  <div className="mb-4 rounded-2xl border border-pine/30 bg-pine/10 p-3 text-center text-xs font-medium text-pine">
                    {basari}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">E-Posta Adresi</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="mail@adresin.com"
                      className="min-h-12 w-full rounded-2xl border border-line bg-cream px-4 text-sm text-ink outline-none transition-all focus:border-pine focus:ring-2 focus:ring-pine/20"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Şifre</label>
                    <input
                      type="password"
                      value={sifre}
                      onChange={(e) => setSifre(e.target.value)}
                      placeholder="••••••"
                      className="min-h-12 w-full rounded-2xl border border-line bg-cream px-4 text-sm text-ink outline-none transition-all focus:border-pine focus:ring-2 focus:ring-pine/20"
                    />
                  </div>

                  {modalMod === "kayit" && (
                    <div>
                      <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted">Şifreyi Onayla</label>
                      <input
                        type="password"
                        value={sifreOnay}
                        onChange={(e) => setSifreOnay(e.target.value)}
                        placeholder="••••••"
                        className="min-h-12 w-full rounded-2xl border border-line bg-cream px-4 text-sm text-ink outline-none transition-all focus:border-pine focus:ring-2 focus:ring-pine/20"
                      />
                    </div>
                  )}

                  {hata && (
                    <div className="rounded-2xl border border-clay/30 bg-clay/10 p-3 text-center text-xs font-medium text-clay">
                      {hata}
                    </div>
                  )}

                  <div className="pt-2">
                    <Btn type="submit">
                      {yukleniyor ? "İşleniyor..." : (modalMod === "giris" ? "Giriş Yap" : "Hesap Oluştur")}
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