export type Cinsiyet = "erkek" | "kadin";
export type Aktivite = "hareketsiz" | "hafif" | "orta" | "aktif" | "cok_aktif";
export type MotorHedef = "kilo_verme" | "kilo_alma" | "koruma";
export type HedefSecim = "yag_yakimi" | "kas_kutlesi" | "koruma";

export const AKTIVITE_CARPAN: Record<Aktivite, number> = {
  hareketsiz: 1.2,
  hafif: 1.375,
  orta: 1.55,
  aktif: 1.725,
  cok_aktif: 1.9,
};

export const AKTIVITE_ETIKET: Record<Aktivite, string> = {
  hareketsiz: "Hareketsiz — masa başı",
  hafif: "Hafif — haftada 1–3 gün",
  orta: "Orta — haftada 3–5 gün",
  aktif: "Aktif — haftada 6–7 gün",
  cok_aktif: "Çok aktif — günde iki seans",
};

export const HEDEF_ETIKET: Record<HedefSecim, string> = {
  yag_yakimi: "Yağ yakımı",
  kas_kutlesi: "Kas kütlesi",
  koruma: "Koruma",
};

export const MOTOR_ETIKET: Record<MotorHedef, string> = {
  kilo_verme: "Yağ yakımı",
  kilo_alma: "Kilo alma",
  koruma: "Koruma",
};

const MIN_KCAL: Record<Cinsiyet, number> = { erkek: 1500, kadin: 1200 };
const KCAL_PER_KG = 7700;
const PROTEIN_KCAL = 4;
const CARB_KCAL = 4;
const FAT_KCAL = 9;

export type Girdi = {
  boyCm: number;
  kiloKg: number;
  hedefKiloKg: number;
  yas: number;
  cinsiyet: Cinsiyet;
  aktivite: Aktivite;
  hedef: MotorHedef;
};

export type Sonuc = {
  hedef: MotorHedef;
  bmr: number;
  tdee: number;
  gunlukKalori: number;
  kaloriFarki: number;
  proteinG: number;
  karbonhidratG: number;
  yagG: number;
  haftalikKg: number;
  sureHafta: number | null;
  uyarilar: string[];
};

export type Profil = {
  boy: number;
  kilo: number;
  hedefKilo: number;
  yas: number;
  cinsiyet: Cinsiyet;
  aktivite: Aktivite;
  hedef: HedefSecim;
};

export const VARSAYILAN_PROFIL: Profil = {
  boy: 180,
  kilo: 95,
  hedefKilo: 80,
  yas: 30,
  cinsiyet: "erkek",
  aktivite: "orta",
  hedef: "yag_yakimi",
};

function roundTo(n: number, digits: number) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

export function motorHedef(hedef: HedefSecim, kilo: number, hedefKilo: number): MotorHedef {
  if (hedef === "yag_yakimi" || hedefKilo < kilo) return "kilo_verme";
  if (hedef === "kas_kutlesi" || hedefKilo > kilo) return "kilo_alma";
  return "koruma";
}

export function hesapla(girdi: Girdi): Sonuc {
  const cinsiyet: Cinsiyet = girdi.cinsiyet === "kadin" ? "kadin" : "erkek";
  const aktivite: Aktivite = girdi.aktivite in AKTIVITE_CARPAN ? girdi.aktivite : "orta";
  let hedef: MotorHedef =
    girdi.hedef === "kilo_verme" || girdi.hedef === "kilo_alma" || girdi.hedef === "koruma"
      ? girdi.hedef
      : "koruma";

  const boyCm = Number.isFinite(girdi.boyCm) ? girdi.boyCm : 180;
  const kiloKg = Number.isFinite(girdi.kiloKg) ? girdi.kiloKg : 80;
  const hedefKiloKg = Number.isFinite(girdi.hedefKiloKg) ? girdi.hedefKiloKg : kiloKg;
  const yas = Number.isFinite(girdi.yas) ? girdi.yas : 30;
  const uyarilar: string[] = [];

  const farkKg = hedefKiloKg - kiloKg;
  const boyM = boyCm / 100;
  const bmi = kiloKg / boyM ** 2;

  const s = cinsiyet === "erkek" ? 5 : -161;
  const bmr = 10 * kiloKg + 6.25 * boyCm - 5 * yas + s;
  const tdee = bmr * AKTIVITE_CARPAN[aktivite];

  let farkKcal: number;
  if (hedef === "koruma" || Math.abs(farkKg) < 0.5) {
    farkKcal = 0;
    hedef = "koruma";
  } else if (hedef === "kilo_verme" || farkKg < 0) {
    hedef = "kilo_verme";
    const acik = Math.min(750, Math.max(300, Math.abs(farkKg) * 35));
    farkKcal = -acik;
  } else {
    hedef = "kilo_alma";
    const fazla = Math.min(500, Math.max(250, Math.abs(farkKg) * 25));
    farkKcal = fazla;
  }

  let hedefKcal = tdee + farkKcal;
  const taban = Math.max(MIN_KCAL[cinsiyet], bmr);
  if (hedef === "kilo_verme" && hedefKcal < taban) {
    hedefKcal = Math.min(taban, tdee);
    uyarilar.push("Açığı güvenli tabana çektim. Daha hızlı kesmek kas kaybettirir.");
  }
  farkKcal = hedefKcal - tdee;

  const refKilo = hedef === "kilo_verme" && bmi >= 30 ? hedefKiloKg : kiloKg;
  const proteinPerKg = { kilo_verme: 2.2, kilo_alma: 1.8, koruma: 1.6 }[hedef];
  let proteinG = proteinPerKg * refKilo;
  let yagG = Math.max((0.25 * hedefKcal) / FAT_KCAL, 0.6 * refKilo);
  let karbKcal = hedefKcal - proteinG * PROTEIN_KCAL - yagG * FAT_KCAL;

  const minKarbG = 100;
  if (karbKcal / CARB_KCAL < minKarbG) {
    let eksik = minKarbG * CARB_KCAL - karbKcal;
    const yagKullan = Math.max(0, yagG - 0.6 * refKilo);
    const yagAzalt = Math.min(yagKullan, eksik / FAT_KCAL);
    yagG -= yagAzalt;
    eksik -= yagAzalt * FAT_KCAL;
    if (eksik > 0) {
      proteinG = Math.max(1.4 * refKilo, proteinG - eksik / PROTEIN_KCAL);
    }
    karbKcal = hedefKcal - proteinG * PROTEIN_KCAL - yagG * FAT_KCAL;
  }

  const karbG = Math.max(karbKcal, 0) / CARB_KCAL;
  const proteinR = Math.round(proteinG);
  const karbR = Math.round(karbG);
  const yagR = Math.round(yagG);
  const gercek = proteinR * PROTEIN_KCAL + karbR * CARB_KCAL + yagR * FAT_KCAL;
  farkKcal = gercek - tdee;

  const haftalikKg = (farkKcal * 7) / KCAL_PER_KG;
  let sureHafta: number | null = null;
  if (hedef !== "koruma" && Math.abs(haftalikKg) > 1e-6) {
    sureHafta = roundTo(Math.abs(farkKg / haftalikKg), 1);
  }

  return {
    hedef,
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    gunlukKalori: Math.round(gercek),
    kaloriFarki: Math.round(farkKcal),
    proteinG: proteinR,
    karbonhidratG: karbR,
    yagG: yagR,
    haftalikKg: roundTo(haftalikKg, 2),
    sureHafta,
    uyarilar,
  };
}

export function profildenHesap(profil: Profil): Sonuc {
  return hesapla({
    boyCm: profil.boy,
    kiloKg: profil.kilo,
    hedefKiloKg: profil.hedefKilo,
    yas: profil.yas,
    cinsiyet: profil.cinsiyet,
    aktivite: profil.aktivite,
    hedef: motorHedef(profil.hedef, profil.kilo, profil.hedefKilo),
  });
}

const tamSayi = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const onda = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const yuzde = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function fmtKg(n: number) {
  return tamSayi.format(n);
}

export function fmtKcal(n: number) {
  return tamSayi.format(n);
}

export function fmtHafta(n: number) {
  return onda.format(n);
}

export function fmtTempo(n: number) {
  return yuzde.format(n);
}

export function tempoCumlesi(sonuc: Sonuc) {
  if (sonuc.hedef === "koruma" || Math.abs(sonuc.haftalikKg) < 0.05) {
    return "Kilonu koruyorsun.";
  }
  const yon = sonuc.haftalikKg < 0 ? "verme" : "alma";
  const tempo = `Haftada yaklaşık ${fmtTempo(Math.abs(sonuc.haftalikKg))} kg ${yon}.`;
  if (sonuc.sureHafta == null) return tempo;
  return `${tempo} Tahmini süre ${fmtHafta(sonuc.sureHafta)} hafta.`;
}

export type Ogun = { ad: string; zaman: string; detay: string };

export function ogunPlani(sonuc: Sonuc): Ogun[] {
  const olcek = Math.min(1.35, Math.max(0.75, sonuc.gunlukKalori / 2300));
  const g = (n: number) => Math.max(40, Math.round((n * olcek) / 10) * 10);
  const yumurta = sonuc.hedef === "kilo_alma" ? 4 : 3;
  const protein = sonuc.hedef === "kilo_alma" ? "kıyma veya somon" : "tavuk, hindi veya balık";
  return [
    {
      ad: "Kahvaltı",
      zaman: "Sabah",
      detay: `${g(70)} g yulaf, ${yumurta} yumurta, yoğurt, 1 tatlı kaşığı keten tohumu.`,
    },
    {
      ad: "Öğle",
      zaman: "Antrenman öncesi",
      detay: `${g(130)} g pirinç veya karabuğday, ${g(170)} g ${protein}, salata.`,
    },
    {
      ad: "Akşam",
      zaman: "Antrenman sonrası",
      detay: `${g(160)} g ${protein}, ${g(120)} g pirinç, bol yeşillik.`,
    },
  ];
}