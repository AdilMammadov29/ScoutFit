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
    <div className="relative min-h-screen overflow-x-hidden bg-[#0c100e] text-[#e8eee9] selection:bg-[#52b788] selection:text-black">
      {/* Premium Atmosfer Işıkları */}
      <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[90vw] max-w-5xl rounded-full bg-gradient-to-b from-[#52b788]/20 via-[#2d6a4f]/10 to-transparent blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-[#52b788]/10 blur-[130px]" />

      {/* Üst Bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-[#0c100e]/80 px-6 py-4 backdrop-blur-xl md:px-12">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#2d6a4f] to-[#52b788] text-black font-black text-sm shadow-md shadow-[#52b788]/20">
            S
          </div>
          <span className="text-base font-extrabold tracking-tight text-white">ScoutFit</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:text-white"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
            className="rounded-xl bg-[#52b788] px-4 py-2 text-xs font-bold text-black shadow-lg shadow-[#52b788]/25 transition hover:bg-[#40916c] active:scale-95"
          >
            Ücretsiz Başla
          </button>
        </div>
      </header>

      {/* Ana Gövde */}
      <main className="relative mx-auto max-w-6xl px-6 pt-16 pb-24 md:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          
          {/* Sol: Net, Spor Odaklı Açıklamalar */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#52b788]/30 bg-[#52b788]/10 px-3.5 py-1.5 text-xs font-semibold text-[#52b788]">
              <span>🔥 Kişisel Antrenman & Beslenme Asistanın</span>
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:leading-[1.15]">
              Vücudunu Dönüştür, <br />
              <span className="bg-gradient-to-r from-[#52b788] via-[#74c69d] to-[#d8f3dc] bg-clip-text text-transparent">
                Hedefine Odaklan.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-400">
              İster kas kütlesi kazanıp hacim al, ister forma girip yağ yak. Günlük antrenmanlarını kaydet, yediklerinin kalorisini takip et ve gelişimini şansa bırakma.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
                className="flex items-center gap-2 rounded-2xl bg-[#52b788] px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-black shadow-xl shadow-[#52b788]/25 transition hover:bg-[#40916c] active:scale-95"
              >
                <span>Hemen Başla</span>
                <span>→</span>
              </button>
              <button
                onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-300 transition hover:bg-white/[0.08]"
              >
                Giriş Yap
              </button>
            </div>

            <div className="mt-10 flex items-center gap-6 text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <span className="text-[#52b788]">✓</span> Kolay Kalori & Makro Takibi
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#52b788]">✓</span> Günlük Antrenman Defteri
              </div>
            </div>
          </div>

          {/* Sağ: İlgi Çekici Sporcu Dashboard Kartı */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 shadow-2xl backdrop-blur-xl">
              
              {/* Üst Kısım: Günün Durumu */}
              <div className="flex items-center justify-between border-b border-white/5 pb-5">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Bugünkü Durum</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">2,850</span>
                    <span className="text-xs font-medium text-[#52b788]">/ 3,000 kcal</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="rounded-full bg-[#52b788]/15 px-3 py-1 text-xs font-bold text-[#52b788]">
                    Hacim & Kilo Alma
                  </span>
                  <span className="mt-1 text-[11px] text-zinc-400">Hedefe 150 kcal kaldı</span>
                </div>
              </div>

              {/* Makro Barları */}
              <div className="mt-5 space-y-3">
                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Protein Hedefi</span>
                    <span className="font-bold text-white">165g / 180g</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-[91%] rounded-full bg-[#52b788]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">Karbonhidrat</span>
                    <span className="font-bold text-white">320g / 350g</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-[91%] rounded-full bg-[#e9c46a]" />
                  </div>
                </div>
              </div>

              {/* Günün Antrenmanı Mini Kartı */}
              <div className="mt-5 rounded-2xl border border-white/5 bg-black/40 p-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">🏋️‍♂️</span>
                    <div>
                      <div className="text-xs font-bold text-white">İtme Günü (Göğüs & Omuz)</div>
                      <div className="text-[11px] text-zinc-400">4 hareket • 16 set tamamlandı</div>
                    </div>
                  </div>
                  <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-[#52b788]">
                    TAMAMLANDI
                  </span>
                </div>
              </div>

              {/* Motivasyon / Seri Rozeti */}
              <div className="mt-4 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <span>🔥</span> <strong className="text-white">6 Günlük Seri</strong> devam ediyor
                </span>
                <span className="text-[#52b788]">Tüm veriler hazır</span>
              </div>

            </div>
          </div>

        </div>

        {/* Alt 3 Özellik Kartı */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
            <div className="text-xl">🎯</div>
            <div className="mt-3 text-sm font-bold text-white">Kişiye Özel Kalori</div>
            <div className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Kilona, boyuna ve hedefine göre sana en uygun günlük kalori ve makroları otomatik çıkarır.
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
            <div className="text-xl">📝</div>
            <div className="mt-3 text-sm font-bold text-white">Antrenman Günlüğü</div>
            <div className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Hangi harekette kaç kilo bastığını unutma. Ağırlık ve tekrar geçmişini pratikçe tut.
            </div>
          </div>

          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-md">
            <div className="text-xl">📍</div>
            <div className="mt-3 text-sm font-bold text-white">GPS & Koşu Takibi</div>
            <div className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Yürüyüş ve koşu rotalarını canlı çiz, harcadığın kaloriyi doğrudan gününe ekle.
            </div>
          </div>
        </div>
      </main>

      {/* Modal */}
      {modalMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#131915] p-7 shadow-2xl relative text-left">
            <button
              onClick={() => setModalMod(null)}
              className="absolute top-5 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>

            <div className="mb-6 flex border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
                className={`pb-1 text-sm font-semibold tracking-wide transition-all ${
                  modalMod === "giris" ? "border-b-2 border-[#52b788] text-[#52b788]" : "text-zinc-400 hover:text-white"
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
                className={`ml-6 pb-1 text-sm font-semibold tracking-wide transition-all ${
                  modalMod === "kayit" ? "border-b-2 border-[#52b788] text-[#52b788]" : "text-zinc-400 hover:text-white"
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            {basari && (
              <div className="mb-4 rounded-xl border border-[#52b788]/30 bg-[#52b788]/10 p-3 text-xs text-[#52b788]">
                {basari}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">E-Posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@mail.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-[#52b788] focus:ring-1 focus:ring-[#52b788]"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-400">Şifre</label>
                <input
                  type="password"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-[#52b788] focus:ring-1 focus:ring-[#52b788]"
                />
              </div>

              {modalMod === "kayit" && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-zinc-400">Şifre Tekrar</label>
                  <input
                    type="password"
                    value={sifreOnay}
                    onChange={(e) => setSifreOnay(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-[#52b788] focus:ring-1 focus:ring-[#52b788]"
                  />
                </div>
              )}

              {hata && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  {hata}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={yukleniyor}
                  className="w-full rounded-xl bg-[#52b788] py-3 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#40916c] active:scale-95"
                >
                  {yukleniyor ? "İşleniyor..." : (modalMod === "giris" ? "Giriş Yap" : "Hesap Oluştur")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}