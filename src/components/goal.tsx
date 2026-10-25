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
import { Btn, Field, fieldClass, PageTitle, Panel, Row } from "@/components/ui";

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
    setNot(`Yeni kilo (${k} kg) kaydedildi ve projeksiyon güncellendi!`);
  }

  const fark =
    hesap.kaloriFarki === 0
      ? "0 kcal"
      : `${hesap.kaloriFarki > 0 ? "+" : "−"}${fmtKcal(Math.abs(hesap.kaloriFarki))} kcal`;

  return (
    <div>
      <PageTitle
        index="02"
        title="Hedef & 2 Haftalık Projeksiyon"
        lede="Ölçüler üstte, hesap altta. GPS kalori harcamaların ve 14 günlük kilo tahmin çizgin burada."
      />

      <div className="space-y-6">
        <Panel title="Ölçüler">
          <div className="grid gap-4 py-5 sm:grid-cols-2">
            <Field label="Boy (cm)">
              <input
                className={fieldClass}
                inputMode="decimal"
                value={form.boy}
                onChange={(e) => sayi("boy", e.target.value)}
              />
            </Field>
            <Field label="Kilo (kg)">
              <input
                className={fieldClass}
                inputMode="decimal"
                value={form.kilo}
                onChange={(e) => sayi("kilo", e.target.value)}
              />
            </Field>
            <Field label="Hedef kilo (kg)">
              <input
                className={fieldClass}
                inputMode="decimal"
                value={form.hedefKilo}
                onChange={(e) => sayi("hedefKilo", e.target.value)}
              />
            </Field>
            <Field label="Yaş">
              <input
                className={fieldClass}
                inputMode="numeric"
                value={form.yas}
                onChange={(e) => sayi("yas", e.target.value)}
              />
            </Field>
          </div>

          <fieldset className="pb-5">
            <legend className="mb-2 text-sm text-muted">Cinsiyet</legend>
            <div className="grid grid-cols-2 gap-2">
              {CINSIYETLER.map((c) => {
                const secili = form.cinsiyet === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setForm({ ...form, cinsiyet: c.id })}
                    className={`min-h-11 rounded-xl text-sm font-medium ${
                      secili ? "bg-pine text-cream" : "border border-line bg-paper text-ink"
                    }`}
                  >
                    {c.ad}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <Field label="Hareket">
            <select
              className={fieldClass}
              value={form.aktivite}
              onChange={(e) => setForm({ ...form, aktivite: e.target.value as Aktivite })}
            >
              {(Object.keys(AKTIVITE_ETIKET) as Aktivite[]).map((k) => (
                <option key={k} value={k}>
                  {AKTIVITE_ETIKET[k]}
                </option>
              ))}
            </select>
          </Field>

          <fieldset className="py-5">
            <legend className="mb-2 text-sm text-muted">Amaç</legend>
            <div className="flex flex-col gap-2">
              {HEDEFLER.map((h) => {
                const secili = form.hedef === h;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setForm({ ...form, hedef: h })}
                    className={`min-h-11 w-full rounded-xl px-4 text-left text-sm font-medium ${
                      secili ? "bg-pine text-cream" : "border border-line bg-paper text-ink"
                    }`}
                  >
                    {HEDEF_ETIKET[h]}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </Panel>

        {/* 2 HAFTALIK GERÇEKÇİ KİLO TAHMİN BANDI */}
        <Panel title="2 Haftalık Kilo Tahmin Bandı">
          <div className="py-4 space-y-4">
            {/* Vurgulu Aralık Kartı */}
            <div className="rounded-xl border border-pine/30 bg-pine/5 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                  14 Gün Sonraki Beklenti
                </span>
                <span className="rounded-full bg-cream px-2 py-0.5 font-mono text-[11px] font-bold text-pine">
                  {fark} / gün
                </span>
              </div>
              <div className="mt-2 text-xl font-bold text-ink">
                {gunlukKaloriFarki === 0 ? (
                  <span>Mevcut kilo korunur (~{bugunkuKilo} kg)</span>
                ) : (
                  <span>
                    {gun14.min} – {gun14.max} kg{" "}
                    <span className="text-xs font-normal text-muted">
                      ({artisMi ? "+" : "−"}{Math.min(Number(toplamNetDegisimMin), Number(toplamNetDegisimMax))} ile {Math.max(Number(toplamNetDegisimMin), Number(toplamNetDegisimMax))} kg arası)
                    </span>
                  </span>
                )}
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-muted">
                * Biyolojik gerçeklik: Su tutulumu, tuz/sodyum tüketimi, glikojen depoları ve uyku düzeni nedeniyle kilo doğrusal bir çizgide ilerlemez. Süreç bu bant aralığında dalgalanarak gerçekleşir.
              </p>
            </div>

            {/* Aralık Izgarası */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              {ikiHaftalikAraliklar.map((t) => (
                <div key={t.gun} className="rounded-xl border border-line bg-cream/30 p-3 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted">
                    {t.gun === 0 ? "Bugün" : `${t.gun}. Gün`}
                  </span>
                  <div className="text-sm font-extrabold text-pine mt-1">
                    {t.gun === 0 ? `${t.hedef} kg` : `${t.min} – ${t.max}`}
                  </div>
                  {t.gun !== 0 && (
                    <span className="text-[10px] text-muted block mt-0.5">kg aralığı</span>
                  )}
                </div>
              ))}
            </div>

            <form onSubmit={kiloKaydiYap} className="flex gap-2 pt-4 border-t border-line">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Örn: 75.5"
                value={yeniKiloInput}
                onChange={(e) => setYeniKiloInput(e.target.value)}
                className={`${fieldClass} flex-1`}
              />
              <button
                type="submit"
                className="rounded-xl bg-pine px-5 py-2.5 text-xs font-bold text-cream transition-all hover:opacity-90 active:scale-95"
              >
                Yeni Kiloyu Kaydet ⚖️
              </button>
            </form>
          </div>
        </Panel>

        <Panel title={ayni ? "Kayıtlı hesap" : "Önizleme"}>
          <div className="border-b border-line py-5">
            <p className="font-display text-5xl tabular-nums leading-none text-ink">
              {fmtKcal(hesap.gunlukKalori)}
            </p>
            <p className="mt-2 text-sm text-muted">günlük kalori · {MOTOR_ETIKET[hesap.hedef]}</p>
          </div>
          <dl>
            <Row label="Bazal metabolizma" value={`${fmtKcal(hesap.bmr)} kcal`} />
            <Row label="Günlük harcama" value={`${fmtKcal(hesap.tdee)} kcal`} />
            <Row label="Fark" value={fark} />
            <Row label="Protein" value={`${hesap.proteinG} g`} />
            <Row label="Karbonhidrat" value={`${hesap.karbonhidratG} g`} />
            <Row label="Yağ" value={`${hesap.yagG} g`} />
          </dl>
          <p className="py-4 text-sm leading-relaxed text-muted">{tempoCumlesi(hesap)}</p>
          {hesap.uyarilar.map((u) => (
            <p key={u} className="border-l-2 border-clay pb-4 pl-3 text-sm leading-relaxed text-ink">
              {u}
            </p>
          ))}
        </Panel>

        <div className="flex flex-wrap items-center gap-3">
          <Btn onClick={kaydetForm} disabled={ayni}>
            {ayni ? "Kayıtlı" : "Kaydet"}
          </Btn>
          {not ? <p className="text-sm text-muted">{not}</p> : null}
        </div>
      </div>
    </div>
  );
}