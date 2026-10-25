import { create } from "zustand";

export type GunDurumu = "temiz" | "dengeli" | "kacamak";

export type KacamakNedeni = 
  | "sosyal" 
  | "tatli_gece" 
  | "stres_yorgunluk" 
  | "porsiyon";

export interface DietState {
  seri: number;
  bugunkuDurum: GunDurumu | null;
  telafiPlani: string | null;
  kacamakNedeni: KacamakNedeni | null;
  kacamakNotu: string | null;
  kayitlar: Record<string, GunDurumu>;
  durumSec: (durum: GunDurumu, detay?: { neden?: KacamakNedeni; not?: string }) => void;
  sifirla: () => void;
}

const NEDEN_TELAFILERI: Record<KacamakNedeni, string[]> = {
  sosyal: [
    "Sosyal anların tadını çıkarmak sürecin parçası. Yarın öğle yemeğinde ekmek/pirinci çıkarıp yeşillik ve tavuk/balık odaklı ilerle.",
    "Sosyal kaçamak sonrası su tutumu normaldir. Yarın fazladan 500 ml su iç ve gün boyu 2.500 ekstra adım at."
  ],
  tatli_gece: [
    "Glikojen depoların doldu. Yarın ilk öğününü 1.5 saat ertele (aralıklı oruç) ve sabah aç karnına 25 dakika tempolu yürü.",
    "Kan şekerini dengelemek için yarın kahvaltıyı atla veya sadece yumurta + avokado gibi sıfır şekerli bir öğün yap."
  ],
  stres_yorgunluk: [
    "Stres kaynaklı kortizol yükselmiş olabilir. Kendini suçlama; bu gece 8 saat deliksiz uyu ve yarın hafif bir kardiyo ile zihnini boşalt.",
    "Yarın kafein tüketimini saat 14:00'te kes, akşam yemeğini hafif bir sebze çorbasıyla tamamla."
  ],
  porsiyon: [
    "Aşırı kalori alımını dengelemek için yarınki karbonhidrat porsiyonlarını yarıya indir ve akşam yemeğini en geç 19:00'da bitir.",
    "Yarın antrenmanına 15 dakika yüksek eğimli bant yürüyüşü ekle ve tuzu minimumda tut."
  ]
};

const GENEL_TELAFILER = [
  "Yarın öğle yemeğinde ekmek ve pirinci çıkarıp tabağı yeşillik ve proteinle doldur.",
  "Yarın gün boyu fazladan 2.000 adım at veya 20 dakika tempolu yürü.",
  "Yarın akşam yemeğini saat 19:00'dan önce tamamla ve hafif bir çorba tercih et."
];

function yerelTarihFormati(d: Date): string {
  const yil = d.getFullYear();
  const ay = String(d.getMonth() + 1).padStart(2, "0");
  const gun = String(d.getDate()).padStart(2, "0");
  return `${yil}-${ay}-${gun}`;
}

function bugununTarihi(): string {
  return yerelTarihFormati(new Date());
}

function hesaplaSeri(kayitlar: Record<string, GunDurumu>): number {
  let sayac = 0;
  const kontrol = new Date();
  const bugunStr = yerelTarihFormati(kontrol);
  const bugunDurum = kayitlar[bugunStr];

  if (bugunDurum === "temiz" || bugunDurum === "dengeli") {
    sayac++;
    kontrol.setDate(kontrol.getDate() - 1);
  } else if (!bugunDurum) {
    kontrol.setDate(kontrol.getDate() - 1);
  } else {
    return 0;
  }

  while (true) {
    const tStr = yerelTarihFormati(kontrol);
    const durum = kayitlar[tStr];
    if (durum === "temiz" || durum === "dengeli") {
      sayac++;
      kontrol.setDate(kontrol.getDate() - 1);
    } else {
      break;
    }
  }

  return sayac;
}

const STORAGE_KEY = "scoutfit_diet_streak_v3";

function kayitYukle() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { kayitlar: {}, telafiPlani: null, kacamakNedeni: null, kacamakNotu: null };
    const parsed = JSON.parse(raw);
    return {
      kayitlar: parsed.kayitlar && typeof parsed.kayitlar === "object" ? parsed.kayitlar : {},
      telafiPlani: parsed.telafiPlani ?? null,
      kacamakNedeni: parsed.kacamakNedeni ?? null,
      kacamakNotu: parsed.kacamakNotu ?? null,
    };
  } catch {
    return { kayitlar: {}, telafiPlani: null, kacamakNedeni: null, kacamakNotu: null };
  }
}

export const useDiet = create<DietState>((set, get) => {
  const yuklenen = kayitYukle();
  const bugun = bugununTarihi();
  const baslangicSeri = hesaplaSeri(yuklenen.kayitlar);

  const kaydetLocal = (
    kayitlar: Record<string, GunDurumu>, 
    telafiPlani: string | null,
    kacamakNedeni: KacamakNedeni | null,
    kacamakNotu: string | null
  ) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ 
      kayitlar, 
      telafiPlani,
      kacamakNedeni,
      kacamakNotu 
    }));
  };

  return {
    seri: baslangicSeri,
    bugunkuDurum: yuklenen.kayitlar[bugun] ?? null,
    telafiPlani: yuklenen.telafiPlani,
    kacamakNedeni: yuklenen.kacamakNedeni,
    kacamakNotu: yuklenen.kacamakNotu,
    kayitlar: yuklenen.kayitlar,

    durumSec: (durum: GunDurumu, detay) => {
      const guncelTarih = bugununTarihi();
      const yeniKayitlar = { ...get().kayitlar, [guncelTarih]: durum };

      let yeniTelafi: string | null = null;
      let yeniNeden: KacamakNedeni | null = null;
      let yeniNot: string | null = null;

      if (durum === "kacamak") {
        yeniNeden = detay?.neden ?? null;
        yeniNot = detay?.not ?? null;

        if (yeniNeden && NEDEN_TELAFILERI[yeniNeden]) {
          const secenekler = NEDEN_TELAFILERI[yeniNeden];
          yeniTelafi = secenekler[Math.floor(Math.random() * secenekler.length)];
        } else {
          yeniTelafi = GENEL_TELAFILER[Math.floor(Math.random() * GENEL_TELAFILER.length)];
        }
      }

      const yeniSeri = hesaplaSeri(yeniKayitlar);

      set({
        bugunkuDurum: durum,
        kayitlar: yeniKayitlar,
        seri: yeniSeri,
        telafiPlani: yeniTelafi,
        kacamakNedeni: yeniNeden,
        kacamakNotu: yeniNot,
      });

      kaydetLocal(yeniKayitlar, yeniTelafi, yeniNeden, yeniNot);
    },

    sifirla: () => {
      set({ 
        seri: 0, 
        bugunkuDurum: null, 
        telafiPlani: null, 
        kacamakNedeni: null, 
        kacamakNotu: null, 
        kayitlar: {} 
      });
      localStorage.removeItem(STORAGE_KEY);
    },
  };
});