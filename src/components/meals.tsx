import { useState, type FormEvent } from "react";
import { useFit } from "@/lib/store";
import { useOgun } from "@/lib/ogun";
import { fmtKcal, profildenHesap } from "@/lib/engine";
import { PageTitle, Panel, Btn } from "@/components/ui";
import { bugunAnahtar, yemekHesapla } from "@/lib/yemek";
import { useI18n } from "@/lib/i18n";
import type { Section } from "./shell";

function hataMesaji(kod: string, dil: "tr" | "en") {
  if (dil === "en") {
    if (kod === "ayiklanamadi") return "Could not recognize food. Try specifying portion, e.g., 2 eggs.";
    if (kod === "yok") return "API key missing. Use quick foods or manual input.";
    if (kod === "ag") return "Network error. Check connection and retry.";
    return "Failed to calculate calories. Please try again.";
  }
  if (kod === "ayiklanamadi")
    return "Bunu bir yiyecek olarak anlayamadım. Miktarıyla yaz, örneğin: 2 dilim salam.";
  if (kod === "yok") return "API anahtarı bulunamadı. Hızlı besinleri veya manuel girişi kullanabilirsin.";
  if (kod === "ag") return "Bağlantı kurulamadı. İnternetini kontrol edip tekrar dene.";
  return "Kalori hesaplanamadı. Bir kez daha dene.";
}

const HIZLI_BESINLER = [
  { ad_tr: "Tavuk Göğsü (150g)", ad_en: "Chicken Breast (150g)", kcal: 248, icon: "🍗" },
  { ad_tr: "Basmati Pirinç (200g)", ad_en: "Basmati Rice (200g)", kcal: 260, icon: "🍚" },
  { ad_tr: "Haşlanmış Yumurta (2 Adet)", ad_en: "Boiled Eggs (2 pcs)", kcal: 155, icon: "🥚" },
  { ad_tr: "Yulaf Ezmesi (60g)", ad_en: "Oatmeal (60g)", kcal: 220, icon: "🥣" },
  { ad_tr: "Karabuğday / Greçka (180g)", ad_en: "Buckwheat (180g)", kcal: 210, icon: "🌾" },
  { ad_tr: "Ton Balığı (1 Kutu)", ad_en: "Canned Tuna (1 Can)", kcal: 190, icon: "🐟" },
  { ad_tr: "Muz (1 Adet)", ad_en: "Banana (1 pc)", kcal: 105, icon: "🍌" },
  { ad_tr: "Süzme Yoğurt (200g)", ad_en: "Greek Yogurt (200g)", kcal: 130, icon: "🥛" },
];

export function MealsView({ git: _git }: { git?: (s: Section) => void }) {
  const { dil, t } = useI18n();
  const profil = useFit((s) => s.profil);
  const tumOgunler = useOgun((s) => s.ogunler);
  const ekleOgunler = useOgun((s) => s.ekleOgunler);
  const silOgun = useOgun((s) => s.silOgun);

  const [metin, setMetin] = useState("");
  const [manuelAd, setManuelAd] = useState("");
  const [manuelKcal, setManuelKcal] = useState("");
  const [hata, setHata] = useState("");
  const [bilgi, setBilgi] = useState("");
  const [yukleniyor, setYukleniyor] = useState(false);

  const bugun = bugunAnahtar();
  const ogunler = tumOgunler.filter((o) => o.tarih === bugun);
  const h = profil ? profildenHesap(profil) : null;
  const gunlukHedef = h ? h.gunlukKalori : 2500;
  const toplam = ogunler.reduce((acc, o) => acc + o.kalori, 0);
  const kalan = gunlukHedef - toplam;

  async function handleEkle(e: FormEvent) {
    e.preventDefault();
    const girdi = metin.trim();
    if (!girdi || yukleniyor) return;
    setHata("");
    setBilgi("");
    setYukleniyor(true);
    try {
      const sonuc = await yemekHesapla({ data: { metin: girdi } });
      if (!sonuc.ok) {
        setHata(hataMesaji(sonuc.hata, dil));
        return;
      }
      ekleOgunler(
        sonuc.ogeler.map((o) => ({ tarih: bugunAnahtar(), isim: o.ad, kalori: o.kcal }))
      );
      setMetin("");
      setBilgi(dil === "en" ? "Meal logged successfully." : "Öğün başarıyla eklendi.");
    } catch {
      setHata(dil === "en" ? "An error occurred. Try manual entry." : "Bir sorun oluştu. Manuel eklemeyi deneyebilirsin.");
    } finally {
      setYukleniyor(false);
    }
  }

  function hizliEkle(ad: string, kcal: number) {
    setHata("");
    ekleOgunler([{ tarih: bugun, isim: ad, kalori: kcal }]);
    setBilgi(`${ad} +${kcal} kcal.`);
  }

  function handleManuelEkle(e: FormEvent) {
    e.preventDefault();
    const ad = manuelAd.trim();
    const kcal = parseInt(manuelKcal, 10);
    if (!ad || isNaN(kcal) || kcal <= 0) {
      setHata(dil === "en" ? "Enter a valid meal name and calorie value." : "Lütfen geçerli bir öğün adı ve kalori değeri gir.");
      return;
    }
    setHata("");
    ekleOgunler([{ tarih: bugun, isim: ad, kalori: kcal }]);
    setManuelAd("");
    setManuelKcal("");
    setBilgi(`${ad} +${kcal} kcal.`);
  }

  return (
    <div className="space-y-6">
      <PageTitle
        index="04"
        title={t.meals.title}
        lede={t.meals.desc}
      />

      {/* Günlük Kalori Durum Özeti */}
      <div className="grid grid-cols-3 gap-3 rounded-2xl border border-line bg-cream p-4 text-center">
        <div>
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">{t.meals.targetBudget}</div>
          <div className="mt-1 font-display text-xl font-bold text-ink">{fmtKcal(gunlukHedef)} <span className="text-xs font-normal">kcal</span></div>
        </div>
        <div className="border-x border-line/60">
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">{t.meals.consumed}</div>
          <div className="mt-1 font-display text-xl font-bold text-pine">{fmtKcal(toplam)} <span className="text-xs font-normal">kcal</span></div>
        </div>
        <div>
          <div className="text-[11px] font-medium text-muted uppercase tracking-wider">{t.meals.remaining}</div>
          <div className={`mt-1 font-display text-xl font-bold ${kalan < 0 ? "text-clay" : "text-ink"}`}>
            {fmtKcal(kalan)} <span className="text-xs font-normal">kcal</span>
          </div>
        </div>
      </div>

      {/* Sık Tüketilenler */}
      <Panel>
        <div className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-line/60">
            <span className="text-xs font-bold uppercase tracking-wider text-ink flex items-center gap-2">
              <span>⚡</span> {t.meals.quickAdd}
            </span>
            <span className="text-[11px] text-muted">{t.meals.oneTouch}</span>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {HIZLI_BESINLER.map((b) => {
              const besinAdi = dil === "en" ? b.ad_en : b.ad_tr;
              return (
                <button
                  key={b.ad_tr}
                  type="button"
                  onClick={() => hizliEkle(besinAdi, b.kcal)}
                  className="flex flex-col items-start rounded-xl border border-line bg-paper/60 p-3 text-left transition hover:border-pine hover:bg-cream active:scale-95"
                >
                  <span className="text-lg">{b.icon}</span>
                  <span className="mt-1.5 text-xs font-semibold text-ink line-clamp-1">{besinAdi}</span>
                  <span className="mt-0.5 text-[11px] font-mono font-bold text-pine">+{b.kcal} kcal</span>
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* Arama & Manuel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Panel>
          <form onSubmit={handleEkle} className="p-5 flex flex-col justify-between h-full">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                {t.meals.aiInputTitle}
              </label>
              <p className="text-xs text-muted mb-3">{t.meals.aiInputDesc}</p>
              <input
                type="text"
                value={metin}
                onChange={(e) => setMetin(e.target.value)}
                placeholder={t.meals.aiInputPlaceholder}
                className="w-full rounded-xl border border-line bg-cream px-3 py-2.5 text-xs text-ink outline-none focus:border-pine"
              />
            </div>
            <div className="mt-4">
              <Btn type="submit" disabled={yukleniyor}>
                {yukleniyor ? t.meals.calculating : t.meals.calcAndAdd}
              </Btn>
            </div>
          </form>
        </Panel>

        <Panel>
          <form onSubmit={handleManuelEkle} className="p-5 flex flex-col justify-between h-full">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-ink mb-1">
                {t.meals.manualTitle}
              </label>
              <p className="text-xs text-muted mb-3">{t.meals.manualDesc}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={manuelAd}
                  onChange={(e) => setManuelAd(e.target.value)}
                  placeholder={t.meals.mealName}
                  className="w-2/3 rounded-xl border border-line bg-cream px-3 py-2.5 text-xs text-ink outline-none focus:border-pine"
                />
                <input
                  type="number"
                  value={manuelKcal}
                  onChange={(e) => setManuelKcal(e.target.value)}
                  placeholder="kcal"
                  className="w-1/3 rounded-xl border border-line bg-cream px-3 py-2.5 text-xs text-ink outline-none focus:border-pine font-mono"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                className="w-full rounded-xl border border-line bg-cream px-4 py-2.5 text-xs font-bold text-ink hover:border-pine transition active:scale-95"
              >
                {t.meals.manualAddBtn}
              </button>
            </div>
          </form>
        </Panel>
      </div>

      {bilgi && <div className="rounded-xl border border-pine/30 bg-pine/10 p-3 text-xs text-pine">{bilgi}</div>}
      {hata && <div className="rounded-xl border border-clay/30 bg-clay/10 p-3 text-xs text-clay">{hata}</div>}

      <Panel>
        <div className="p-5">
          <div className="flex items-center justify-between pb-3 border-b border-line/60">
            <span className="text-xs font-bold uppercase tracking-wider text-ink">{t.meals.todayMeals}</span>
            <span className="text-xs font-mono font-bold text-pine">{toplam} kcal</span>
          </div>

          {ogunler.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted">{t.meals.noMeals}</p>
          ) : (
            <ul className="mt-3 divide-y divide-line/40">
              {ogunler.map((o) => (
                <li key={o.id} className="flex items-center justify-between py-2.5 text-xs">
                  <span className="text-ink font-medium">{o.isim}</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-ink">{o.kalori} kcal</span>
                    <button
                      type="button"
                      onClick={() => silOgun(o.id)}
                      className="text-muted hover:text-clay transition"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>
    </div>
  );
}