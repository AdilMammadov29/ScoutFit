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
  adimSifirla: () => void;
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

const STORAGE_KEY = "scoutfit_activity_v2";

function bugununTarihi(): string {
  return new Date().toISOString().split("T")[0];
}

function adimdanKm(adim: number): number {
  return Number(((adim * 0.75) / 1000).toFixed(2));
}

function kayitYukle(): { bugunAdim: number; bugunSuMl: number; gecmis: GunlukKayit[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const bugun = bugununTarihi();
    if (!raw) return { bugunAdim: 0, bugunSuMl: 0, gecmis: [] };

    const parsed = JSON.parse(raw);
    const gecmis: GunlukKayit[] = Array.isArray(parsed.gecmis) ? parsed.gecmis : [];
    const bugunKayit = gecmis.find((k) => k.tarih === bugun);

    return {
      bugunAdim: bugunKayit ? bugunKayit.adim : 0,
      bugunSuMl: bugunKayit ? bugunKayit.suMl : 0,
      gecmis,
    };
  } catch {
    return { bugunAdim: 0, bugunSuMl: 0, gecmis: [] };
  }
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
      const yeniAdim = Math.max(0, get().bugunAdim + miktar);
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

    adimSifirla: () => {
      const bugun = bugununTarihi();
      let gecmis = [...get().gecmis];
      const index = gecmis.findIndex((k) => k.tarih === bugun);
      if (index >= 0) gecmis[index] = { ...gecmis[index], adim: 0 };
      set({ bugunAdim: 0, gecmis });
      kaydet(0, get().bugunSuMl, gecmis);
    },

    istatistikleriGetir: () => {
      const bugun = bugununTarihi();
      const gecmis = get().gecmis;
      const bugunKayit = gecmis.find((k) => k.tarih === bugun);
      const gunlukAdim = bugunKayit ? bugunKayit.adim : get().bugunAdim;

      // Son 7 günün gün adlarını ve verilerini oluştur
      const gunAdlari = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
      const haftalikGunler: { gun: string; adim: number }[] = [];
      let haftalikAdim = 0;

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const tStr = d.toISOString().split("T")[0];
        const kayit = gecmis.find((k) => k.tarih === tStr);
        const adimDegeri = kayit ? kayit.adim : (tStr === bugun ? gunlukAdim : 0);
        haftalikGunler.push({ gun: gunAdlari[d.getDay()], adim: adimDegeri });
        haftalikAdim += adimDegeri;
      }

      // Son 30 günün toplamı
      let aylikAdim = 0;
      for (let i = 29; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const tStr = d.toISOString().split("T")[0];
        const kayit = gecmis.find((k) => k.tarih === tStr);
        aylikAdim += kayit ? kayit.adim : (tStr === bugun ? gunlukAdim : 0);
      }

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