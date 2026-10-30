import { useState, type ReactNode } from "react";
import { useFit } from "../lib/store";
import { useEkstra, type Birim, type KiloKaydi } from "../lib/extras";
import type { Section } from "./shell";
import {
  User,
  Target,
  TrendingDown,
  Trash2,
  Plus,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

const LB = 2.20462;
const alanClass =
  "w-full min-h-[44px] rounded-xl border border-line bg-paper px-3.5 py-2.5 text-[14px] text-ink outline-none placeholder:text-muted/60 transition-colors focus:border-muted/60";

function sayiOku(metin: string): number | null {
  const n = Number(metin.replace(",", ".").trim());
  return Number.isFinite(n) && n > 0 ? n : null;
}

function sayiYaz(n: number) {
  return n.toFixed(1).replace(".", ",");
}

function kiloYaz(kg: number, birim: Birim) {
  return `${sayiYaz(birim === "lb" ? kg * LB : kg)} ${birim}`;
}

function tarihKisa(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(
    new Date(iso)
  );
}

function Alan({ etiket, children }: { etiket: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] text-muted">{etiket}</span>
      {children}
    </label>
  );
}

function KisiselPanel() {
  const profil = useFit((s) => s.profil);
  const kaydetProfil = useFit((s) => s.kaydetProfil);
  const ad = useEkstra((s: any) => s.ad);
  const setAd = useEkstra((s: any) => s.setAd);
  const ekleKilo = useEkstra((s: any) => s.ekleKilo);

  const [adForm, setAdForm] = useState(ad || "");
  const [boy, setBoy] = useState(String(profil?.boy ?? ""));
  const [kilo, setKilo] = useState(String(profil?.kilo ?? ""));
  const [hedefKilo, setHedefKilo] = useState(String(profil?.hedefKilo ?? ""));
  const [yas, setYas] = useState(String(profil?.yas ?? ""));
  const [not, setNot] = useState("");

  if (!profil) return null;

  const kaydet = () => {
    const b = sayiOku(boy);
    const k = sayiOku(kilo);
    const hk = sayiOku(hedefKilo);
    const y = sayiOku(yas);
    if (!b || b < 100 || b > 250) return setNot("Boy 100–250 cm arasında olmalı.");
    if (!k || k < 30 || k > 300) return setNot("Kilo 30–300 kg arasında olmalı.");
    if (!hk || hk < 30 || hk > 300) return setNot("Hedef kilo 30–300 kg arasında olmalı.");
    if (!y || y < 12 || y > 100) return setNot("Yaş 12–100 arasında olmalı.");
    kaydetProfil({ ...profil, boy: b, kilo: k, hedefKilo: hk, yas: Math.round(y) });
    setAd(adForm.trim().slice(0, 40));
    if (k !== profil.kilo) ekleKilo(k);
    setNot("Bilgiler güncellendi.");
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2 border-b border-line pb-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine/10 text-pine">
          <User className="w-4 h-4" />
        </div>
        <h2 className="font-serif text-lg font-bold text-ink">Kişisel Bilgiler ve Ölçüler</h2>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2">
        <Alan etiket="Ad Soyad">
          <input
            className={alanClass}
            value={adForm}
            placeholder="Adın"
            onChange={(e) => setAdForm(e.target.value)}
          />
        </Alan>
        <Alan etiket="Yaş">
          <input
            className={alanClass}
            value={yas}
            inputMode="numeric"
            onChange={(e) => setYas(e.target.value)}
          />
        </Alan>
        <Alan etiket="Boy (cm)">
          <input
            className={alanClass}
            value={boy}
            inputMode="decimal"
            onChange={(e) => setBoy(e.target.value)}
          />
        </Alan>
        <Alan etiket="Mevcut Kilo (kg)">
          <input
            className={alanClass}
            value={kilo}
            inputMode="decimal"
            onChange={(e) => setKilo(e.target.value)}
          />
        </Alan>
        <div className="sm:col-span-2">
          <Alan etiket="Hedef Kilo (kg)">
            <input
              className={alanClass}
              value={hedefKilo}
              inputMode="decimal"
              placeholder="örn. 75"
              onChange={(e) => setHedefKilo(e.target.value)}
            />
          </Alan>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={kaydet}
          className="min-h-[44px] rounded-xl bg-pine px-5 py-2.5 text-[13px] font-medium text-paper transition-opacity hover:opacity-95 active:scale-95"
        >
          Kaydet
        </button>
        {not && (
          <div className="flex items-center gap-1.5 text-[13px] text-muted">
            {not.includes("güncellendi") ? (
              <CheckCircle2 className="w-4 h-4 text-pine shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-clay shrink-0" />
            )}
            <span>{not}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function HedeflerPanel() {
  const [haftalikKm, setHaftalikKm] = useState(
    () => localStorage.getItem("scoutfit_hedef_km") || "20"
  );
  const [hedefHiz, setHedefHiz] = useState(
    () => localStorage.getItem("scoutfit_hedef_hiz") || "27"
  );
  const [haftalikGun, setHaftalikGun] = useState(
    () => localStorage.getItem("scoutfit_hedef_gun") || "4"
  );
  const [kaydedildi, setKaydedildi] = useState(false);

  const kaydetHedefler = () => {
    localStorage.setItem("scoutfit_hedef_km", haftalikKm);
    localStorage.setItem("scoutfit_hedef_hiz", hedefHiz);
    localStorage.setItem("scoutfit_hedef_gun", haftalikGun);
    setKaydedildi(true);
    setTimeout(() => setKaydedildi(false), 2500);
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2 border-b border-line pb-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine/10 text-pine">
          <Target className="w-4 h-4" />
        </div>
        <h2 className="font-serif text-lg font-bold text-ink">Dönemlik Hedefler</h2>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-3">
        <Alan etiket="Haftalık Mesafe (km)">
          <input
            className={alanClass}
            value={haftalikKm}
            inputMode="numeric"
            onChange={(e) => setHaftalikKm(e.target.value)}
          />
        </Alan>
        <Alan etiket="Hedef Hız (km/s)">
          <input
            className={alanClass}
            value={hedefHiz}
            inputMode="numeric"
            onChange={(e) => setHedefHiz(e.target.value)}
          />
        </Alan>
        <Alan etiket="Antrenman Sıklığı (Gün)">
          <input
            className={alanClass}
            value={haftalikGun}
            inputMode="numeric"
            onChange={(e) => setHaftalikGun(e.target.value)}
          />
        </Alan>
      </div>

      <div className="mt-5 flex items-center gap-3 pt-2">
        <button
          type="button"
          onClick={kaydetHedefler}
          className="min-h-[44px] rounded-xl bg-pine px-5 py-2.5 text-[13px] font-medium text-paper transition-opacity hover:opacity-95 active:scale-95"
        >
          Hedefleri Güncelle
        </button>
        {kaydedildi && (
          <div className="flex items-center gap-1.5 text-[13px] text-pine">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Hedefler kaydedildi.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function KiloGrafik({
  kayitlar,
  hedef,
  birim,
  guncelKilo,
}: {
  kayitlar: KiloKaydi[];
  hedef?: number;
  birim: Birim;
  guncelKilo?: number;
}) {
  const aktifKayitlar =
    kayitlar.length > 0
      ? kayitlar
      : [{ id: "varsayilan", kilo: guncelKilo ?? 75, tarih: new Date().toISOString() }];

  const W = 560;
  const H = 200;
  const P = 32;
  const dono = (kg: number) => (birim === "lb" ? kg * LB : kg);
  const degerler = aktifKayitlar.map((k) => dono(k.kilo));
  const hedefD = hedef !== undefined ? dono(hedef) : undefined;
  const tum = hedefD !== undefined ? [...degerler, hedefD] : degerler;
  const min = Math.min(...tum) - 1;
  const max = Math.max(...tum) + 1;

  const x = (i: number) =>
    aktifKayitlar.length === 1 ? W / 2 : P + (i * (W - 2 * P)) / (aktifKayitlar.length - 1);
  const y = (v: number) => H - P - ((v - min) / (max - min)) * (H - 2 * P);
  const nokta = degerler.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full py-2" role="img" aria-label="Kilo grafiği">
      {hedefD !== undefined ? (
        <line
          x1={P}
          x2={W - P}
          y1={y(hedefD)}
          y2={y(hedefD)}
          stroke="currentColor"
          strokeDasharray="4 4"
          className="text-clay/60 stroke-[1.5]"
        />
      ) : null}
      <polyline
        points={nokta}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        className="text-pine"
      />
      {degerler.map((v, i) => (
        <circle
          key={aktifKayitlar[i].id}
          cx={x(i)}
          cy={y(v)}
          r={4}
          fill="currentColor"
          className="text-pine"
        />
      ))}
      <text x={P} y={H - 8} className="fill-muted text-[11px] font-sans">
        {tarihKisa(aktifKayitlar[0].tarih)}
      </text>
      <text x={W - P} y={H - 8} textAnchor="end" className="fill-muted text-[11px] font-sans">
        {tarihKisa(aktifKayitlar[aktifKayitlar.length - 1].tarih)}
      </text>
      <text x={P} y={16} className="fill-muted text-[11px] font-sans">
        {sayiYaz(max)} {birim}
      </text>
    </svg>
  );
}

function KiloPanel() {
  const profil = useFit((s) => s.profil);
  const kayitlar = useEkstra((s: any) => s.kiloKayitlari) || [];
  const birim = useEkstra((s: any) => s.birim);
  const ekleKilo = useEkstra((s: any) => s.ekleKilo);
  const silKilo = useEkstra((s: any) => s.silKilo);
  const [giris, setGiris] = useState("");
  const [not, setNot] = useState("");

  const ekle = () => {
    const n = sayiOku(giris);
    if (!n) return setNot("Geçerli bir sayı yaz.");
    const kg = birim === "lb" ? n / LB : n;
    if (kg < 30 || kg > 300) return setNot("Değer 30–300 kg arasında olmalı.");
    ekleKilo(Math.round(kg * 10) / 10);
    setGiris("");
    setNot("");
  };

  const ilk = kayitlar[0];
  const son = kayitlar[kayitlar.length - 1];
  const fark =
    ilk && son ? (birim === "lb" ? (son.kilo - ilk.kilo) * LB : son.kilo - ilk.kilo) : 0;
  const sonBes = kayitlar.slice(-5).reverse();

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="flex items-center gap-2 border-b border-line pb-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine/10 text-pine">
          <TrendingDown className="w-4 h-4" />
        </div>
        <h2 className="font-serif text-lg font-bold text-ink">Kilo ve Gelişim</h2>
      </div>

      <div className="rounded-xl border border-line bg-paper/40 p-2">
        <KiloGrafik
          kayitlar={kayitlar}
          hedef={profil?.hedefKilo}
          birim={birim}
          guncelKilo={profil?.kilo}
        />
      </div>

      {kayitlar.length >= 2 ? (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-paper/60 px-4 py-3">
          <span className="text-[13px] text-muted">Toplam Değişim</span>
          <span className="font-serif text-base font-bold text-ink">
            {fark > 0 ? "+" : ""}{sayiYaz(fark)} {birim}
          </span>
        </div>
      ) : null}

      <div className="mt-4 flex items-end gap-2.5">
        <div className="flex-1">
          <Alan etiket={`Bugünkü kilo (${birim})`}>
            <input
              className={alanClass}
              value={giris}
              inputMode="decimal"
              placeholder={birim === "lb" ? "örn. 165" : "örn. 75,4"}
              onChange={(e) => setGiris(e.target.value)}
            />
          </Alan>
        </div>
        <button
          type="button"
          onClick={ekle}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-pine px-4 py-2.5 text-[13px] font-medium text-paper transition-opacity hover:opacity-95 active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Ekle</span>
        </button>
      </div>

      {not && (
        <p className="mt-2 text-[13px] text-clay">{not}</p>
      )}

      <div className="mt-5 border-t border-line pt-3">
        {sonBes.length > 0 ? (
          <ul className="divide-y divide-line">
            {sonBes.map((k: any) => (
              <li key={k.id} className="flex items-center justify-between py-2.5 text-[13px]">
                <span className="text-muted">{tarihKisa(k.tarih)}</span>
                <div className="flex items-center gap-3">
                  <span className="font-serif font-semibold text-ink">{kiloYaz(k.kilo, birim)}</span>
                  <button
                    type="button"
                    onClick={() => silKilo(k.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:text-clay hover:bg-paper transition-colors"
                    aria-label="Kaydı sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-2 text-center text-[13px] text-muted">
            Henüz geçmiş kayıt yok. Profilindeki kilo baz alınıyor.
          </p>
        )}
      </div>
    </div>
  );
}

export function ProfilView({ git }: { git: (s: Section) => void }) {
  const profil = useFit((s: any) => s.profil);
  const ad = useEkstra((s: any) => s.ad);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Üst Başlık */}
      <div className="border-b border-line pb-4">
        <span className="text-[13px] font-medium text-muted block">
          Kişisel Bilgiler
        </span>
        <h1 className="font-serif text-2xl font-bold text-ink">
          {ad ? ad : "Profil"}
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          Fiziksel ölçülerin, hedeflerin ve gelişim grafiğin.
        </p>
      </div>

      <div className="space-y-6">
        {!profil ? (
          <div className="rounded-xl border border-line bg-surface p-6 text-center">
            <p className="text-[14px] text-muted">Önce ölçülerini kaydet.</p>
            <button
              type="button"
              onClick={() => git("goal")}
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-pine px-5 py-2.5 text-[13px] font-medium text-paper transition-opacity hover:opacity-95 active:scale-95"
            >
              <span>Hedefe Git</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <>
            <KisiselPanel />
            <HedeflerPanel />
            <KiloPanel />
          </>
        )}
      </div>
    </div>
  );
}