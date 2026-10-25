import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { bulutaBaglan } from "@/lib/sync";

export function AuthView() {
  const [modalMod, setModalMod] = useState<"giris" | "kayit" | null>(null);
  const [email, setEmail] = useState("");
  const [sifre, setSifre] = useState("");
  const [sifreOnay, setSifreOnay] = useState("");
  const [hata, setHata] = useState("");
  const [basari, setBasari] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  // İnteraktif Mini Simülatör State'i
  const [simKilo, setSimKilo] = useState<number>(78);
  const [simBoy, setSimBoy] = useState<number>(182);
  const [simHedef, setSimHedef] = useState<"bulk" | "cut">("bulk");

  // Anlık Önizleme Hesabı (Ziyaretçiyi büyüleyen canlı tepki)
  const simSonuc = useMemo(() => {
    const bmr = 10 * simKilo + 6.25 * simBoy - 5 * 22 + 5;
    const tdee = bmr * 1.55;
    const kalori = simHedef === "bulk" ? Math.round(tdee + 350) : Math.round(tdee - 450);
    const protein = Math.round(simKilo * (simHedef === "bulk" ? 2.0 : 2.2));
    const karb = Math.round((kalori * (simHedef === "bulk" ? 0.50 : 0.40)) / 4);
    const yag = Math.round((kalori * (simHedef === "bulk" ? 0.25 : 0.25)) / 9);
    return { kalori, protein, karb, yag };
  }, [simKilo, simBoy, simHedef]);

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
    <div className="relative min-h-screen overflow-x-hidden bg-[#070908] text-[#f0fdf4] font-sans selection:bg-[#10b981] selection:text-black">
      {/* 1. ÜST SEVİYE GÖRSEL EFEKTLER (NEON GLOW & MESH ARKA PLAN) */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[650px] w-[95vw] max-w-7xl rounded-full bg-gradient-to-b from-[#10b981]/25 via-[#047857]/15 to-transparent blur-[140px]" />
      <div className="pointer-events-none absolute top-1/4 -left-40 h-[450px] w-[450px] rounded-full bg-[#10b981]/15 blur-[160px]" />
      <div className="pointer-events-none absolute bottom-10 -right-20 h-[500px] w-[500px] rounded-full bg-[#f59e0b]/10 blur-[170px]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* 2. GLASSMORPHISM NAVBAR */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.08] bg-[#070908]/75 px-6 py-4 backdrop-blur-2xl md:px-12">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-[#10b981] via-[#059669] to-[#047857] p-0.5 shadow-lg shadow-[#10b981]/30">
            <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#070908]">
              <span className="font-display font-black text-sm text-[#10b981]">SF</span>
            </div>
          </div>
          <div>
            <span className="font-display text-base font-extrabold tracking-tight text-white">
              SCOUTFIT
            </span>
            <span className="ml-1.5 rounded-md bg-[#10b981]/20 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#10b981]">
              PRO
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:text-white hover:bg-white/5"
          >
            Giriş Yap
          </button>
          <button
            onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
            className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] px-5 py-2 text-xs font-bold text-black shadow-lg shadow-[#10b981]/30 transition hover:scale-105 active:scale-95"
          >
            <span className="relative z-10 flex items-center gap-1.5">
              <span>Hemen Katıl</span>
              <span className="transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </button>
        </div>
      </header>

      {/* 3. HERO SAHNESİ */}
      <main className="relative mx-auto max-w-7xl px-6 pt-12 pb-24 md:px-12">
        
        {/* Üst Rozet & Başlık */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#10b981]/40 bg-[#10b981]/10 px-4 py-1.5 text-xs font-semibold text-[#10b981] shadow-inner backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#10b981] opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#10b981]"></span>
            </span>
            <span>Yeni Nesil Atletik Performans & Beslenme</span>
          </div>

          <h1 className="mt-6 font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl md:text-7xl leading-[1.08]">
            Potansiyelini <br />
            <span className="bg-gradient-to-r from-[#10b981] via-[#34d399] to-[#fbbf24] bg-clip-text text-transparent">
              Maksimuma Çıkar.
            </span>
          </h1>

          <p className="mt-6 text-base md:text-lg leading-relaxed text-zinc-400 max-w-2xl mx-auto">
            Gelişigüzel antrenman yapmayı bırak. Günlük kalori fazlasını, progressive overload ağırlıklarını ve rotalarını tek bir profesyonel panelden yönet.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
              className="flex items-center gap-2 rounded-2xl bg-[#10b981] px-8 py-4 text-xs font-black uppercase tracking-wider text-black shadow-2xl shadow-[#10b981]/40 transition hover:bg-[#34d399] hover:scale-105 active:scale-95"
            >
              <span>Ücretsiz Profilini Aç</span>
              <span></span>
            </button>
            <button
              onClick={() => { setModalMod("giris"); setHata(""); setBasari(""); }}
              className="rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-4 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-md transition hover:bg-white/[0.08]"
            >
              Hesabıma Dön
            </button>
          </div>
        </div>

        {/* 4. MERKEZİ VİTRİN: İNTERAKTİF SİMÜLATÖR & CANLI SPORCU DASHBOARDU */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-12 items-stretch">
          
          {/* Sol Panel: Canlı Kalori & Hedef Simülatörü */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-6 md:p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 h-40 w-40 bg-[#10b981]/10 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold tracking-wider uppercase text-[#10b981]">
                  Anlık Metabolizma Simülatörü
                </span>
                <span className="text-[11px] text-zinc-400">Canlı Hesapla</span>
              </div>

              <h2 className="mt-2 text-xl font-bold text-white">Vücut Hedefini Seç</h2>
              <p className="text-xs text-zinc-400 mt-1">Değerleri kaydır, hedefine göre vücudunun ihtiyacını anında gör.</p>

              {/* Hedef Seçim Butonları */}
              <div className="mt-5 grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black/40 border border-white/5">
                <button
                  type="button"
                  onClick={() => setSimHedef("bulk")}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    simHedef === "bulk" 
                      ? "bg-[#10b981] text-black shadow-md shadow-[#10b981]/30" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  💪 Hacim & Kilo Alma
                </button>
                <button
                  type="button"
                  onClick={() => setSimHedef("cut")}
                  className={`py-2 text-xs font-bold rounded-xl transition ${
                    simHedef === "cut" 
                      ? "bg-[#f59e0b] text-black shadow-md shadow-[#f59e0b]/30" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                   Yağ Yakımı (Defisit)
                </button>
              </div>

              {/* Sliderlar */}
              <div className="mt-6 space-y-4">
                <div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-400">Mevcut Kilo</span>
                    <span className="text-white font-bold font-mono">{simKilo} kg</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="130"
                    value={simKilo}
                    onChange={(e) => setSimKilo(Number(e.target.value))}
                    className="mt-2 w-full accent-[#10b981] cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-zinc-400">Boy</span>
                    <span className="text-white font-bold font-mono">{simBoy} cm</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="210"
                    value={simBoy}
                    onChange={(e) => setSimBoy(Number(e.target.value))}
                    className="mt-2 w-full accent-[#10b981] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Simülatör Sonuç Kartı */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-zinc-400">Önerilen Günlük Kalori:</span>
                <span className="text-3xl font-black font-display text-white">
                  {simSonuc.kalori.toLocaleString("tr-TR")} <span className="text-xs text-[#10b981]">kcal</span>
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-white/5 p-2">
                  <div className="text-[10px] text-zinc-400">PROTEİN</div>
                  <div className="text-sm font-bold text-[#10b981] font-mono">{simSonuc.protein}g</div>
                </div>
                <div className="rounded-xl bg-white/5 p-2">
                  <div className="text-[10px] text-zinc-400">KARBONHİDRAT</div>
                  <div className="text-sm font-bold text-[#f59e0b] font-mono">{simSonuc.karb}g</div>
                </div>
                <div className="rounded-xl bg-white/5 p-2">
                  <div className="text-[10px] text-zinc-400">YAĞ</div>
                  <div className="text-sm font-bold text-zinc-300 font-mono">{simSonuc.yag}g</div>
                </div>
              </div>
            </div>

          </div>

          {/* Sağ Panel: Canlı Sporcu Telemetrisi & Performans Hub */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4">
            
            {/* Üst Kart Grubu: Rekorlar & Günlük Nabız / Kalori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Kart 1: Bench / Squat PR */}
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Ağırlık PR Gelişimi</span>
                  <span className="rounded-full bg-[#10b981]/20 px-2 py-0.5 text-[10px] font-bold text-[#10b981]">
                    +12.5 kg bu ay
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">110.0</span>
                  <span className="text-xs text-zinc-400 font-mono">kg Bench Press</span>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="text-emerald-400">▲</span> 
                  <span>Son set: 110 kg × 5 tekrar (RPE 8.5)</span>
                </div>
              </div>

              {/* Kart 2: Kardiyo & Yakılan Efor */}
              <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">GPS & Koşu Temposu</span>
                  <span className="flex items-center gap-1 text-[11px] text-red-400 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping" />
                    142 BPM
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">5.42</span>
                  <span className="text-xs text-zinc-400 font-mono">km • 28:14 dk</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-zinc-400">
                  <span>Ortalama Pace: <strong>5'12" /km</strong></span>
                  <span className="text-[#10b981] font-bold">410 kcal yakıldı</span>
                </div>
              </div>

            </div>

            {/* Büyük Alt Kart: Günlük Antrenman Çizelgesi & Seri */}
            <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-6 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#10b981]/20 text-xl">
                    
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Bugünkü Program: Göğüs & Arka Kol</h3>
                    <p className="text-xs text-zinc-400">4 hareket • Toplam 16 set tamamlandı</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-[#10b981]">7 GÜNLÜK SERİ </div>
                  <div className="text-[11px] text-zinc-400">Disiplin puanı: %100</div>
                </div>
              </div>

              {/* Setlerin Canlı Önizlemesi */}
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="rounded-2xl border border-white/5 bg-black/40 p-3">
                  <div className="text-[11px] text-zinc-400 truncate">Incline DB Press</div>
                  <div className="mt-1 text-sm font-bold text-white">34 kg × 10</div>
                  <div className="text-[10px] text-[#10b981]">4 Set Tamam</div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-black/40 p-3">
                  <div className="text-[11px] text-zinc-400 truncate">Dips (Ağırlıklı)</div>
                  <div className="mt-1 text-sm font-bold text-white">+20 kg × 8</div>
                  <div className="text-[10px] text-[#10b981]">3 Set Tamam</div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-black/40 p-3">
                  <div className="text-[11px] text-zinc-400 truncate">Cable Fly</div>
                  <div className="mt-1 text-sm font-bold text-white">17.5 kg × 14</div>
                  <div className="text-[10px] text-[#10b981]">4 Set Tamam</div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-black/40 p-3">
                  <div className="text-[11px] text-zinc-400 truncate">Triceps Pushdown</div>
                  <div className="mt-1 text-sm font-bold text-white">32 kg × 12</div>
                  <div className="text-[10px] text-[#10b981]">4 Set Tamam</div>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 5. ALT VİTRİN DEĞER ÖNERİSİ KARTLARI */}
        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#10b981]/15 text-2xl">
              🎯
            </div>
            <h4 className="mt-4 text-base font-bold text-white">Hatasız Kalori Bütçesi</h4>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Kilo almak için gereken temiz kalori fazlasını ya da yağ yakımındaki koruyucu kalori tabanını milimetrik ayarlar.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f59e0b]/15 text-2xl">
              📈
            </div>
            <h4 className="mt-4 text-base font-bold text-white">Progressive Overload Takibi</h4>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Hangi antrenmanda ne bastığını hatırla. Set ve tekrar geçmişinle her hafta daha güçlü olmanı sağlar.
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.05] to-transparent p-6 backdrop-blur-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#3b82f6]/15 text-2xl">
              🛰️
            </div>
            <h4 className="mt-4 text-base font-bold text-white">Canlı GPS & Rota Kaydı</h4>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              Koşu ve kardiyolarını harita üzerinde kaydet, yaktığın kalorileri anında günlük beslenme hedefine ekle.
            </p>
          </div>
        </div>

      </main>

      {/* 6. MODAL (GİRİŞ & KAYIT) */}
      {modalMod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#101412] p-8 shadow-2xl relative text-left">
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
                className={`pb-1 text-sm font-bold tracking-wide transition-all ${
                  modalMod === "giris" ? "border-b-2 border-[#10b981] text-[#10b981]" : "text-zinc-400 hover:text-white"
                }`}
              >
                Giriş Yap
              </button>
              <button
                type="button"
                onClick={() => { setModalMod("kayit"); setHata(""); setBasari(""); }}
                className={`ml-6 pb-1 text-sm font-bold tracking-wide transition-all ${
                  modalMod === "kayit" ? "border-b-2 border-[#10b981] text-[#10b981]" : "text-zinc-400 hover:text-white"
                }`}
              >
                Kayıt Ol
              </button>
            </div>

            {basari && (
              <div className="mb-4 rounded-xl border border-[#10b981]/30 bg-[#10b981]/10 p-3 text-xs text-[#10b981]">
                {basari}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">E-Posta</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ad@ornek.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-zinc-300">Şifre</label>
                <input
                  type="password"
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
                />
              </div>

              {modalMod === "kayit" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-zinc-300">Şifre Tekrar</label>
                  <input
                    type="password"
                    value={sifreOnay}
                    onChange={(e) => setSifreOnay(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-xs text-white outline-none transition focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981]"
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
                  className="w-full rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] py-3 text-xs font-black uppercase tracking-wider text-black shadow-lg shadow-[#10b981]/30 transition hover:brightness-110 active:scale-95"
                >
                  {yukleniyor ? "Lütfen Bekle..." : (modalMod === "giris" ? "Giriş Yap" : "Hesap Oluştur")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}