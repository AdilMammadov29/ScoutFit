import { create } from "zustand";

export interface GunlukKayit {
  tarih: string; // YYYY-MM-DD
  adim: number;
  suMl: number;
}

interface ActivityState {
  bugunAdim: number;
  bugunSuMl: number;
  hedefSuMl: number;
  hedefAdim: number;
  gecmis: GunlukKayit[];
  suEkle: (miktarMl: number) => void;
  suSifirla: () => void;
  adimEkle: (miktar: number) => void;
  istatistikleriGetir: () => {
    gunlukAdim: number;
    gunlukKm: number;
    haftalikAdim: number;
    haftalikKm: number;
    aylikAdim: number;
    aylikKm: number;
    haftalikGunler: { gun: string; adim: number }[];
  };
}

const STORAGE_KEY = "scoutfit_activity_v1";

function bugununTarihi(): string {
  return new Date().toISOString().split("T")[0];
}

function adimdanKm(adim: number): number {
  return Number(((adim * 0.75) / 1000).toFixed(1));
}

function kayitYukle(): { bugunAdim: number; bugunSuMl: number; gecmis: GunlukKayit[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const bugun = bugununTarihi();
    if (!raw) return { bugunAdim: 4250, bugunSuMl: 1250, gecmis: ornekGecmisUret() };
    
    const parsed = JSON.parse(raw);
    const bugunKayit = parsed.gecmis?.find((k: GunlukKayit) => k.tarih === bugun);

    return {
      bugunAdim: bugunKayit ? bugunKayit.adim : 0,
      bugunSuMl: bugunKayit ? bugunKayit.suMl : 0,
      gecmis: parsed.gecmis || ornekGecmisUret(),
    };
  } catch {
    return { bugunAdim: 4250, bugunSuMl: 1250, gecmis: ornekGecmisUret() };
  }
}

function ornekGecmisUret(): GunlukKayit[] {
  const liste: GunlukKayit[] = [];
  const bugun = new Date();
  for (let i = 28; i >= 1; i--) {
    const d = new Date(bugun);
    d.setDate(d.getDate() - i);
    liste.push({
      tarih: d.toISOString().split("T")[0],
      adim: Math.floor(4500 + Math.random() * 6000),
      suMl: 2000,
    });
  }
  return liste;
}

export const useActivity = create<ActivityState>((set, get) => {
  const yuklenen = kayitYukle();

  const kaydet = (bugunAdim: number, bugunSuMl: number, gecmis: GunlukKayit[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ gecmis }));
  };

  return {
    bugunAdim: yuklenen.bugunAdim,
    bugunSuMl: yuklenen.bugunSuMl,
    hedefSuMl: 2500,
    hedefAdim: 10000,
    gecmis: yuklenen.gecmis,

    suEkle: (miktarMl: number) => {
      const bugun = bugununTarihi();
      const yeniSu = get().bugunSuMl + miktarMl;
      let gecmis = [...get().gecmis];
      const index = gecmis.findIndex((k) => k.tarih === bugun);

      if (index >= 0) {
        gecmis[index] = { ...gecmis[index], suMl: yeniSu };
      } else {
        gecmis.push({ tarih: bugun, adim: get().bugunAdim, suMl: yeniSu });
      }

      set({ bugunSuMl: yeniSu, gecmis });
      kaydet(get().bugunAdim, yeniSu, gecmis);
    },

    suSifirla: () => {
      const bugun = bugununTarihi();
      let gecmis = [...get().gecmis];
      const index = gecmis.findIndex((k) => k.tarih === bugun);
      if (index >= 0) gecmis[index] = { ...gecmis[index], suMl: 0 };
      set({ bugunSuMl: 0, gecmis });
      kaydet(get().bugunAdim, 0, gecmis);
    },

    adimEkle: (miktar: number) => {
      const bugun = bugununTarihi();
      const yeniAdim = get().bugunAdim + miktar;
      let gecmis = [...get().gecmis];
      const index = gecmis.findIndex((k) => k.tarih === bugun);

      if (index >= 0) {
        gecmis[index] = { ...gecmis[index], adim: yeniAdim };
      } else {
        gecmis.push({ tarih: bugun, adim: yeniAdim, suMl: get().bugunSuMl });
      }

      set({ bugunAdim: yeniAdim, gecmis });
      kaydet(yeniAdim, get().bugunSuMl, gecmis);
    },

    istatistikleriGetir: () => {
      const bugun = bugununTarihi();
      const gecmis = get().gecmis;
      const bugunKayit = gecmis.find((k) => k.tarih === bugun);
      const gunlukAdim = bugunKayit ? bugunKayit.adim : get().bugunAdim;

      const son7Gun = gecmis.slice(-7);
      const haftalikAdim = son7Gun.reduce((acc, k) => acc + k.adim, 0) + (bugunKayit ? 0 : gunlukAdim);

      const son30Gun = gecmis.slice(-30);
      const aylikAdim = son30Gun.reduce((acc, k) => acc + k.adim, 0) + (bugunKayit ? 0 : gunlukAdim);

      const gunAdlari = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
      const haftalikGunler = son7Gun.map((k) => {
        const d = new Date(k.tarih);
        return { gun: gunAdlari[d.getDay()], adim: k.adim };
      });

      return {
        gunlukAdim,
        gunlukKm: adimdanKm(gunlukAdim),
        haftalikAdim,
        haftalikKm: adimdanKm(haftalikAdim),
        aylikAdim,
        aylikKm: adimdanKm(aylikAdim),
        haftalikGunler,
      };
    },
  };
});