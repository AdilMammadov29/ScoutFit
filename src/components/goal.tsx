import { useState } from "react";
import {
  AKTIVITE_ETIKET,
  type Aktivite,
  type Cinsiyet,
  type HedefSecim,
  HEDEF_ETIKET,
  MOTOR_ETIKET,
  type Profil,
  profildenHesap,
  tempoCumlesi,
  VARSAYILAN_PROFIL,
  fmtKcal,
} from "@/lib/engine";
import { useFit } from "@/lib/store";
import { useEkstra } from "@/lib/extras";
import {
  Target,
  TrendingDown,
  Flame,
  Scale,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Plus,
} from "lucide-react";

const HEDEFLER: HedefSecim[] = ["yag_yakimi", "kas_kutlesi", "koruma"];
const CINSIYETLER: { id: Cinsiyet; ad: string }[] = [
  { id: "kadin", ad: "Kadın" },
  { id: "erkek", ad: "Erkek" },
];

export function GoalView() {
  const kayitli = useFit((s) => s.profil);
  const kaydet = useFit((s) => s.kaydetProfil);

  const yeniKiloEkle = useEkstra((s: any) => s.kiloEkle);

  const [form, setForm] = useState<Profil>(kayitli ?? VARSAYILAN_PROFIL);
  const [not, setNot] = useState("");
  const [yeniKiloInput, setYeniKiloInput] = useState("");

  const hesap = profildenHesap(form);
  const ayni = kayitli != null && JSON.stringify(kayitli) === JSON.stringify(form);

  function sayi(alan: "boy" | "kilo" | "hedefKilo" | "yas", deger: string) {
    const n = Number(deger.replace(",", "."));
    if (!Number.isFinite(n)) return;
    setForm({ ...form, [alan]: n });
    setNot("");
  }

  function kaydetForm() {
    const temiz: Profil = {
      ...form,
      boy: Math.round(form.boy),
      yas: Math.round(form.yas),
      kilo: Math.round(form.kilo * 10) / 10,
      hedefKilo: Math.round(form.hedefKilo * 10) / 10,
    };
    if (temiz.boy < 120 || temiz.boy > 230 || temiz.kilo < 35 || temiz.kilo > 250) {
      setNot("Boy 120–230 cm, kilo 35–250 kg aralığında olmalı.");
      return;
    }
    if (temiz.yas < 16 || temiz.yas > 80) {
      setNot("Yaş 16–80 arasında olmalı.");
      return;
    }
    kaydet(temiz);
    setForm(temiz);
    setNot("Kaydedildi. Bugün ekranı bu sayıları kullanır.");
  }

  // 14 günlük gerçekçi projeksiyon (aralıklı dalgalanma bandı)
  const gunlukKaloriFarki = hesap.kaloriFarki;
  const teorikGunlukKilo = gunlukKaloriFarki / 7700;
  const bugunkuKilo = form.kilo;

  const ikiHaftalikAraliklar = [0, 3, 7, 10, 14].map((gun) => {
    if (gun === 0) {
      return { gun, min: bugunkuKilo, max: bugunkuKilo, hedef: bugunkuKilo };
    }
    const teorikDegisim = teorikGunlukKilo * gun;
    // Biyolojik dalgalanma katsayıları (%75 ihtiyatlı, %125 agresif)
    const degisim1 = Number((teorikDegisim * 0.75).toFixed(2));
    const degisim2 = Number((teorikDegisim * 1.25).toFixed(2));
    const minKilo = Number((bugunkuKilo + Math.min(degisim1, degisim2)).toFixed(2));
    const maxKilo = Number((bugunkuKilo + Math.max(degisim1, degisim2)).toFixed(2));
    const ortaKilo = Number((bugunkuKilo + teorikDegisim).toFixed(2));

    return { gun, min: minKilo, max: maxKilo, hedef: ortaKilo };
  });

  const gun14 = ikiHaftalikAraliklar[ikiHaftalikAraliklar.length - 1];
  const toplamNetDegisimMin = Math.abs(gun14.min - bugunkuKilo).toFixed(2);
  const toplamNetDegisimMax = Math.abs(gun14.max - bugunkuKilo).toFixed(2);
  const artisMi = gunlukKaloriFarki > 0;

  function kiloKaydiYap(e: React.FormEvent) {
    e.preventDefault();
    const k = Number(yeniKiloInput.replace(",", "."));
    if (!Number.isFinite(k) || k < 35 || k > 250) return;

    if (yeniKiloEkle) {
      yeniKiloEkle(k);
    }
    setForm({ ...form, kilo: k });
    setYeniKiloInput("");
    setNot(`Yeni kilo (${k} kg) kaydedildi ve projeksiyon güncellendi.`);
  }

  const fark =
    hesap.kaloriFarki === 0
      ? "0 kcal"
      : `${hesap.kaloriFarki > 0 ? "+" : "−"}${fmtKcal(Math.abs(hesap.kaloriFarki))} kcal`;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Üst Başlık */}
      <div className="border-b border-line pb-4">
        <span className="text-[13px] font-medium text-muted block">
          Hedef & Hesaplama
        </span>
        <h1 className="font-serif text-2xl font-bold text-ink">
          Hedef & Kilo Projeksiyonu
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Fiziksel parametrelerin, kalori hesaplaman ve 14 günlük biyolojik kilo bandın.
        </p>
      </div>

      <div className="space-y-6">
        {/* 1. Ölçüler Kartı */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2 border-b border-line pb-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine/10 text-pine">
              <Target className="w-4 h-4" />
            </div>
            <h2 className="font-serif text-lg font-bold text-ink">Fiziksel Parametreler</h2>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="text-[13px] text-muted block mb-1.5">Boy (cm)</label>
              <input
                className="w-full min-h-[44px] rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-muted/60"
                inputMode="decimal"
                value={form.boy}
                onChange={(e) => sayi("boy", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[13px] text-muted block mb-1.5">Kilo (kg)</label>
              <input
                className="w-full min-h-[44px] rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-muted/60"
                inputMode="decimal"
                value={form.kilo}
                onChange={(e) => sayi("kilo", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[13px] text-muted block mb-1.5">Hedef Kilo (kg)</label>
              <input
                className="w-full min-h-[44px] rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-muted/60"
                inputMode="decimal"
                value={form.hedefKilo}
                onChange={(e) => sayi("hedefKilo", e.target.value)}
              />
            </div>
            <div>
              <label className="text-[13px] text-muted block mb-1.5">Yaş</label>
              <input
                className="w-full min-h-[44px] rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none transition-colors focus:border-muted/60"
                inputMode="numeric"
                value={form.yas}
                onChange={(e) => sayi("yas", e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line">
            <span className="text-[13px] text-muted block mb-2">Cinsiyet</span>
            <div className="grid grid-cols-2 gap-2">
              {CINSIYETLER.map((c) => {
                const secili = form.cinsiyet === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm({ ...form, cinsiyet: c.id })}
                    className={`min-h-[44px] rounded-xl text-[13px] font-medium transition-colors ${
                      secili
                        ? "bg-pine text-paper"
                        : "border border-line bg-paper text-ink hover:border-muted/40"
                    }`}
                  >
                    {c.ad}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-line">
            <label className="text-[13px] text-muted block mb-1.5">Günlük Hareket Seviyesi</label>
            <select
              className="w-full min-h-[44px] rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] text-ink outline-none transition-colors focus:border-muted/60"
              value={form.aktivite}
              onChange={(e) => setForm({ ...form, aktivite: e.target.value as Aktivite })}
            >
              {(Object.keys(AKTIVITE_ETIKET) as Aktivite[]).map((k) => (
                <option key={k} value={k}>
                  {AKTIVITE_ETIKET[k]}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 pt-3 border-t border-line">
            <span className="text-[13px] text-muted block mb-2">Hedef Stratejisi</span>
            <div className="flex flex-col gap-2">
              {HEDEFLER.map((h) => {
                const secili = form.hedef === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setForm({ ...form, hedef: h })}
                    className={`flex min-h-[44px] items-center justify-between rounded-xl px-4 py-2 text-left text-[13px] font-medium transition-colors ${
                      secili
                        ? "bg-pine text-paper"
                        : "border border-line bg-paper text-ink hover:border-muted/40"
                    }`}
                  >
                    <span>{HEDEF_ETIKET[h]}</span>
                    {secili && <span className="h-2 w-2 rounded-full bg-paper" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={kaydetForm}
              disabled={ayni}
              className="min-h-[44px] rounded-xl bg-pine px-5 py-2.5 text-[13px] font-medium text-paper transition-opacity hover:opacity-95 disabled:opacity-40 active:scale-95"
            >
              {ayni ? "Kaydedildi" : "Ayarları Kaydet"}
            </button>
            {not && (
              <div className="flex items-center gap-1.5 text-[13px] text-muted">
                {not.includes("Kaydedildi") || not.includes("güncellendi") ? (
                  <CheckCircle2 className="w-4 h-4 text-pine shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-clay shrink-0" />
                )}
                <span>{not}</span>
              </div>
            )}
          </div>
        </div>

        {/* 2. 14 Günlük Kilo Tahmin Bandı */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2 border-b border-line pb-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine/10 text-pine">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-ink leading-none">
                14 Günlük Biyolojik Kilo Bandı
              </h2>
              <span className="text-[12px] text-muted mt-1 block">
                Dalgalanma ve projeksiyon aralığı
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-pine/30 bg-pine/5 p-4 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-muted">
                14 Gün Sonraki Beklenti
              </span>
              <span className="rounded-full border border-line bg-paper px-2.5 py-0.5 font-serif text-[12px] font-semibold text-pine">
                {fark} / gün
              </span>
            </div>
            <div className="mt-2 font-serif text-2xl font-bold text-ink">
              {gunlukKaloriFarki === 0 ? (
                <span>Mevcut kilo korunur (~{bugunkuKilo} kg)</span>
              ) : (
                <span>
                  {gun14.min} – {gun14.max} kg{" "}
                  <span className="text-[13px] font-normal text-muted font-sans">
                    ({artisMi ? "+" : "−"}{Math.min(Number(toplamNetDegisimMin), Number(toplamNetDegisimMax))} ile {Math.max(Number(toplamNetDegisimMin), Number(toplamNetDegisimMax))} kg arası)
                  </span>
                </span>
              )}
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">
              * Su tutulumu, sodyum tüketimi, glikojen depoları ve uyku dalgalanmaları nedeniyle kilo doğrusal ilerlemez; süreç bu aralık bandında hareket eder.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {ikiHaftalikAraliklar.map((t) => (
              <div key={t.gun} className="rounded-xl border border-line bg-paper/60 p-3 text-center">
                <span className="text-[11px] text-muted block">
                  {t.gun === 0 ? "Bugün" : `${t.gun}. Gün`}
                </span>
                <div className="font-serif text-sm font-bold text-pine mt-1">
                  {t.gun === 0 ? `${t.hedef} kg` : `${t.min} – ${t.max}`}
                </div>
                {t.gun !== 0 && (
                  <span className="text-[10px] text-muted block mt-0.5">kg bandı</span>
                )}
              </div>
            ))}
          </div>

          <form onSubmit={kiloKaydiYap} className="mt-5 flex gap-2 pt-4 border-t border-line">
            <input
              type="text"
              inputMode="decimal"
              placeholder="Yeni kilonu gir (örn: 75.5)"
              value={yeniKiloInput}
              onChange={(e) => setYeniKiloInput(e.target.value)}
              className="flex-1 min-h-[44px] rounded-xl border border-line bg-paper px-3.5 py-2 text-[14px] text-ink outline-none placeholder:text-muted/60 transition-colors focus:border-muted/60"
            />
            <button
              type="submit"
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-pine px-4 py-2 text-[13px] font-medium text-paper transition-opacity hover:opacity-95 active:scale-95 shrink-0"
            >
              <Scale className="w-4 h-4" />
              <span>Kaydet</span>
            </button>
          </form>
        </div>

        {/* 3. Hesap Özeti & Makrolar */}
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2 border-b border-line pb-3 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine/10 text-pine">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-bold text-ink leading-none">
                {ayni ? "Kayıtlı Plan" : "Hesap Önizlemesi"}
              </h2>
              <span className="text-[12px] text-muted mt-1 block">
                {MOTOR_ETIKET[hesap.hedef]}
              </span>
            </div>
          </div>

          <div className="border-b border-line pb-5 pt-1">
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-4xl font-bold tabular-nums text-ink">
                {fmtKcal(hesap.gunlukKalori)}
              </span>
              <span className="text-[13px] text-muted">kcal / gün</span>
            </div>
          </div>

          <dl className="divide-y divide-line">
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <dt className="text-muted">Bazal Metabolizma (BMR)</dt>
              <dd className="font-serif font-semibold text-ink">{fmtKcal(hesap.bmr)} kcal</dd>
            </div>
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <dt className="text-muted">Toplam Günlük Harcama (TDEE)</dt>
              <dd className="font-serif font-semibold text-ink">{fmtKcal(hesap.tdee)} kcal</dd>
            </div>
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <dt className="text-muted">Hedef Kalori Farkı</dt>
              <dd className="font-serif font-semibold text-pine">{fark}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <dt className="text-muted">Hedef Protein</dt>
              <dd className="font-serif font-semibold text-ink">{hesap.proteinG} g</dd>
            </div>
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <dt className="text-muted">Hedef Karbonhidrat</dt>
              <dd className="font-serif font-semibold text-ink">{hesap.karbonhidratG} g</dd>
            </div>
            <div className="flex items-center justify-between py-2.5 text-[13px]">
              <dt className="text-muted">Hedef Yağ</dt>
              <dd className="font-serif font-semibold text-ink">{hesap.yagG} g</dd>
            </div>
          </dl>

          <p className="mt-4 rounded-xl bg-paper/60 p-3 text-[13px] leading-relaxed text-muted border border-line">
            {tempoCumlesi(hesap)}
          </p>

          {hesap.uyarilar.length > 0 && (
            <div className="mt-3 space-y-2">
              {hesap.uyarilar.map((u) => (
                <div key={u} className="flex items-start gap-2 rounded-xl border border-clay/30 bg-clay/5 p-3 text-[13px] text-clay">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{u}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}