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
import { Btn, Field, fieldClass, PageTitle, Panel, Row } from "@/components/ui";

const HEDEFLER: HedefSecim[] = ["yag_yakimi", "kas_kutlesi", "koruma"];
const CINSIYETLER: { id: Cinsiyet; ad: string }[] = [
  { id: "kadin", ad: "Kadın" },
  { id: "erkek", ad: "Erkek" },
];

export function GoalView() {
  const kayitli = useFit((s) => s.profil);
  const kaydet = useFit((s) => s.kaydetProfil);
  const [form, setForm] = useState<Profil>(kayitli ?? VARSAYILAN_PROFIL);
  const [not, setNot] = useState("");

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

  const fark =
    hesap.kaloriFarki === 0
      ? "0 kcal"
      : `${hesap.kaloriFarki > 0 ? "+" : "−"}${fmtKcal(Math.abs(hesap.kaloriFarki))} kcal`;

  return (
    <div>
      <PageTitle
        index="02"
        title="Hedef"
        lede="Ölçüler üstte, hesap altta. Kaydetmeden Bugün ekranı değişmez."
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