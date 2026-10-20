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
    <div className="relative min-h-screen overflow-x-hidden bg-[#0d0f0e] text-[#e5ece8] selection:bg-[#6f9f87] selection:text-black">
      {/* ŞAŞAALI ARKA PLAN IŞIKLARI & GRID DERİNLİĞİ */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[95vw] max-w-6xl rounded-full bg-gradient-to-b from-[#6f9f87]/20 via-[#4e7d67]/10 to-transparent blur-[130px]" />
      <div className="pointer-events-none absolute top-1/2 -left-32 h-96 w-96 rounded-full bg-[#6f9f87]/10 blur-[140px]" />
      <div className="pointer-events-none absolute bottom-10 right-0 h-96 w-96 rounded-full bg-[#b39573]/10 blur-[130px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* ÜST BAR (NAVBAR) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-[#0d0f0e]/75 px-6 py-4 backdrop-blur-xl md:px-12">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3 items-center justify-center">
            <span className="absolute h-full w-full animate-ping rounded-full bg-[#6f9f87] opacity-75"></span>
            <span className="relative h-2 w-2 rounded-full bg-[#6f9f87]"></span>
          </div>
          <span className="font-mono text-sm font-bold tracking-wider text-white">
            SCOUTFIT <span className="text-[#6f9f87]">ENGINE</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur-md transition-all hover:border-[#6f9f87]/50 hover:bg-white/10 active:scale-95"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
            className="rounded-xl bg-[#6f9f87] px-4 py-2 text-xs font-semibold text-black shadow-lg shadow-[#6f9f87]/20 transition-all hover:bg-[#82b49c] active:scale-95"
          >
            Kayıt Ol
          </button>
        </div>
      </header>

      {/* HERO & CANLI METRİK SAHNESİ */}
      <main className="relative mx-auto max-w-6xl px-6 pt-16 pb-24 md:px-12">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          
          {/* Sol Kolon: Başlık ve Açıklamalar */}
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#6f9f87]/30 bg-[#6f9f87]/10 px-3.5 py-1.5 font-mono text-xs font-medium text-[#6f9f87] shadow-sm backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-[#6f9f87] animate-pulse" />
              <span>v2.4 Core • Akıllı Beslenme & Antrenman</span>
            </div>

            <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:leading-[1.1]">
              Sayılarla Şekillenen <br />
              <span className="bg-gradient-to-r from-[#6f9f87] via-[#8fc4ab] to-[#e0cca7] bg-clip-text text-transparent">
                Kişisel Performans.
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-400">
              Tahminlere yer yok. Mifflin-St Jeor metabolik motoruyla günlük kalori, dinamik makro ve antrenman hacmini senkronize yönet.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
                className="group relative flex items-center gap-2 overflow-hidden rounded-2xl bg-[#6f9f87] px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-black shadow-xl shadow-[#6f9f87]/25 transition-all hover:bg-[#82b49c] hover:shadow-[#6f9f87]/40 active:scale-95"
              >
                <span>Hemen Başla</span>
                <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
              </button>
              <button
                onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-7 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-300 backdrop-blur-md transition-all hover:border-[#6f9f87]/40 hover:bg-white/[0.08]"
              >
                Mevcut Hesap
              </button>
            </div>
          </div>

          {/* Sağ Kolon: Şaşaalı Canlı Panel Simülasyonu */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 shadow-2xl backdrop-blur-2xl">
              <div className="absolute -top-3 -right-3 rounded-full border border-[#6f9f87]/40 bg-[#121c17] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#6f9f87]">
                Canlı Telemetri
              </div>

              {/* Günlük Kalori Göstergesi */}
              <div className="flex items-end justify-between border-b border-white/5 pb-5">
                <div>
                  <div className="font-mono text-xs text-zinc-400 uppercase tracking-wider">Hedef Bütçe</div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-4xl font-black text-white">2,850</span>
                    <span className="font-mono text-xs text-[#6f9f87]">kcal / gün</span>
                  </div>
                </div>
                <div className="rounded-xl border border-[#6f9f87]/20 bg-[#6f9f87]/10 px-3 py-1.5 text-right font-mono text-xs text-[#6f9f87]">
                  +350 kcal Lean Bulk
                </div>
              </div>

              {/* Makro Barları */}
              <div className="mt-5 space-y-3.5">
                <div>
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-zinc-400">Protein (2.0g/kg)</span>
                    <span className="font-bold text-white">160g / 180g</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-[88%] rounded-full bg-[#6f9f87]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-zinc-400">Karbonhidrat (Kompleks)</span>
                    <span className="font-bold text-white">310g / 340g</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-[91%] rounded-full bg-[#b39573]" />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between font-mono text-xs">
                    <span className="text-zinc-400">Sağlıklı Yağlar</span>
                    <span className="font-bold text-white">65g / 70g</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-[92%] rounded-full bg-zinc-400" />
                  </div>
                </div>
              </div>

              {/* Alt Bilgi Rozeti */}
              <div className="mt-6 flex items-center justify-between rounded-xl border border-white/5 bg-black/40 px-4 py-3 font-mono text-xs text-zinc-400">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Supabase Cloud Eşitleme
                </span>
                <span className="text-[#6f9f87]">Aktif</span>
              </div>
            </div>
          </div>

        </div>

        {/* ALT İSTATİSTİK ŞERİDİ */}
        <div className="mt-20 grid grid-cols-2 gap-4 rounded-3xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl sm:grid-cols-4">
          <div className="border-r border-white/5 pr-4 last:border-0">
            <div className="font-mono text-xs text-zinc-500 uppercase">Motor</div>
            <div className="mt-1 font-display text-xl font-bold text-white">Mifflin-St Jeor</div>
            <div className="mt-0.5 text-[11px] text-zinc-400">Hassas BMR & TDEE</div>
          </div>
          <div className="border-r border-white/5 pr-4 last:border-0">
            <div className="font-mono text-xs text-zinc-500 uppercase">Beslenme Modeli</div>
            <div className="mt-1 font-display text-xl font-bold text-white">Dinamik Makro</div>
            <div className="mt-0.5 text-[11px] text-zinc-400">Hedefe göre g/kg dağılımı</div>
          </div>
          <div className="border-r border-white/5 pr-4 last:border-0">
            <div className="font-mono text-xs text-zinc-500 uppercase">Hedef Odaklı</div>
            <div className="mt-1 font-display text-xl font-bold text-[#6f9f87]">Lean Bulk / Defisit</div>
            <div className="mt-0.5 text-[11px] text-zinc-400">Akıllı kalori farkı</div>
          </div>
          <div>
            <div className="font-mono text-xs text-zinc-500 uppercase">Altyapı</div>
            <div className="mt-1 font-display text-xl font-bold text-white">PostgreSQL & Auth</div>
            <div className="mt-0.5 text-[11px] text-zinc-400">Gerçek zamanlı depolama</div>
          </div>
        </div>
      </main>

      {/* GİRİŞ / KAYIT MODAL */}
      {modalMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#141816] p-7 shadow-2xl relative text-left">
            <button
              onClick={() => setModalMod(null)}
              className="absolute top-5 right-5 flex h-7 w-7 items-center justify-center rounded-full bg-white/5 font-mono text-xs text-zinc-400 hover:text-white"
            >
              ✕
            </button>

            <div className="mb-6 flex border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
                className={`pb-1 text-sm font-semibold tracking-wide transition-all ${
                  modalMod === "giris" ? "border-b-2 border-[#6f9f87] text-[#6f9f87]" : "text-zinc-400 hover:text-white"
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
                className={`ml-6 pb-1 text-sm font-semibold tracking-wide transition-all ${
                  modalMod === "kayit" ? "border-b-2 border-[#6f9f87] text-[#6f9f87]" : "text-zinc-400 hover:text-white"
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            {basari && (
              <div className="mb-4 rounded-xl border border-[#6f9f87]/30 bg-[#6f9f87]/10 p-3 text-xs text-[#6f9f87]">
                {basari}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">E-Posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ad@ornek.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-[#6f9f87] focus:ring-1 focus:ring-[#6f9f87]"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">Şifre</label>
                <input
                  type="password"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-[#6f9f87] focus:ring-1 focus:ring-[#6f9f87]"
                />
              </div>

              {modalMod === "kayit" && (
                <div>
                  <label className="mb-1 block font-mono text-[11px] uppercase tracking-wider text-zinc-400">Şifre Tekrar</label>
                  <input
                    type="password"
                    value={sifreOnay}
                    onChange={(e) => setSifreOnay(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-[#6f9f87] focus:ring-1 focus:ring-[#6f9f87]"
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
                  className="w-full rounded-xl bg-[#6f9f87] py-3 text-xs font-bold uppercase tracking-wider text-black transition-all hover:bg-[#82b49c] active:scale-95"
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