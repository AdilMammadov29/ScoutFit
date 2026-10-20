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
      setHata("Şifreler uyuşmuyor.");
      return;
    }

    setYukleniyor(true);

    if (modalMod === "giris") {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: sifre,
      });

      if (error) {
        setHata("Giriş yapılamadı: " + error.message);
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
        setBasari("Hesap oluşturuldu. Giriş yapılıyor...");
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
    <div className="relative min-h-screen overflow-y-auto bg-paper text-ink selection:bg-pine selection:text-paper font-sans">
      {/* İnce Grid Deseni (Mühendislik / Analitik Havası) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#1c2826_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03]"></div>

      {/* Üst Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line/60 bg-paper/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-pine"></div>
          <span className="font-mono text-sm font-semibold tracking-wider uppercase text-pine">ScoutFit Engine</span>
        </div>
        <button
          onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
          className="rounded-xl border border-line bg-cream px-4 py-2 text-xs font-medium text-ink transition hover:border-pine"
        >
          Giriş Yap
        </button>
      </header>

      {/* Hero Alanı */}
      <main className="relative mx-auto max-w-4xl px-6 pt-20 pb-28">
        <div className="inline-flex items-center gap-2 rounded-md border border-line bg-cream px-3 py-1 font-mono text-xs text-muted">
          <span>v2.4</span>
          <span>•</span>
          <span>Kişisel Antrenman & Makro Takibi</span>
        </div>

        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink sm:text-6xl">
          Veriye dayalı gelişim, <br />
          <span className="text-pine">tutarlı sonuçlar.</span>
        </h1>

        <p className="mt-6 max-w-xl text-base leading-relaxed text-muted font-normal">
          Kalori açıklarını, antrenman hacmini ve kilo alma/verme hedeflerini matematiksel hassasiyetle hesapla. Bulut senkronizasyonuyla tüm verilerin anında güvende.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
            className="rounded-xl bg-pine px-6 py-3 text-xs font-semibold uppercase tracking-wider text-paper transition hover:bg-pine/90 active:scale-95"
          >
            Hesap Oluştur
          </button>
          <button
            onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
            className="rounded-xl border border-line px-6 py-3 text-xs font-semibold uppercase tracking-wider text-ink transition hover:bg-cream"
          >
            Mevcut Hesaba Giriş
          </button>
        </div>

        {/* Metrik Göstergeleri */}
        <div className="mt-16 grid grid-cols-2 gap-4 border-t border-line/60 pt-8 sm:grid-cols-4">
          <div>
            <div className="font-mono text-xs uppercase text-muted">Metodoloji</div>
            <div className="mt-1 font-display text-lg font-bold text-ink">Mifflin-St Jeor</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase text-muted">Makro Modeli</div>
            <div className="mt-1 font-display text-lg font-bold text-ink">G/Kg Temelli Dağılım</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase text-muted">Hedef Tipleri</div>
            <div className="mt-1 font-display text-lg font-bold text-ink">Defisit / Lean Bulk</div>
          </div>
          <div>
            <div className="font-mono text-xs uppercase text-muted">Senkronizasyon</div>
            <div className="mt-1 font-display text-lg font-bold text-ink">Supabase Cloud</div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {modalMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm">
            <Panel>
              <div className="relative p-6">
                <button
                  onClick={() => setModalMod(null)}
                  className="absolute top-4 right-4 text-xs font-mono text-muted hover:text-ink"
                >
                  [ESC]
                </button>

                <div className="mb-5 flex border-b border-line pb-3">
                  <button
                    type="button"
                    onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
                    className={`pb-1 text-sm font-semibold tracking-wide transition-all ${
                      modalMod === "giris" ? "border-b-2 border-pine text-pine" : "text-muted hover:text-ink"
                    }`}
                  >
                    Giriş Yap
                  </button>
                  <button
                    type="button"
                    onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
                    className={`ml-6 pb-1 text-sm font-semibold tracking-wide transition-all ${
                      modalMod === "kayit" ? "border-b-2 border-pine text-pine" : "text-muted hover:text-ink"
                    }`}
                  >
                    Kayıt Ol
                  </button>
                </div>

                {basari && (
                  <div className="mb-4 rounded-lg border border-pine/30 bg-pine/10 p-2.5 text-xs text-pine">
                    {basari}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
                  <div>
                    <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">E-Posta</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ad@ornek.com"
                      className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-xs text-ink outline-none focus:border-pine"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">Şifre</label>
                    <input
                      type="password"
                      value={sifre}
                      onChange={(e) => setSifre(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-xs text-ink outline-none focus:border-pine"
                    />
                  </div>

                  {modalMod === "kayit" && (
                    <div>
                      <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-muted">Şifre Tekrar</label>
                      <input
                        type="password"
                        value={sifreOnay}
                        onChange={(e) => setSifreOnay(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-xs text-ink outline-none focus:border-pine"
                      />
                    </div>
                  )}

                  {hata && (
                    <div className="rounded-lg border border-clay/30 bg-clay/10 p-2.5 text-xs text-clay">
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