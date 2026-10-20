import { create } from "zustand";

export type Dil = "tr" | "en";

export interface SozlukYapisi {
  nav: {
    today: string;
    goal: string;
    train: string;
    meals: string;
    gps: string;
    coach: string;
    profile: string;
    menu: string;
    logout: string;
    subtitle: string;
  };
  today: {
    targetCal: string;
    consumed: string;
    remaining: string;
    burned: string;
  };
  meals: {
    title: string;
    desc: string;
    quickAdd: string;
    oneTouch: string;
    aiInputTitle: string;
    aiInputDesc: string;
    aiInputPlaceholder: string;
    calcAndAdd: string;
    calculating: string;
    manualTitle: string;
    manualDesc: string;
    mealName: string;
    manualAddBtn: string;
    todayMeals: string;
    noMeals: string;
  };
  common: {
    kcal: string;
    added: string;
    deleted: string;
  };
}

export const SOZLUK: Record<Dil, SozlukYapisi> = {
  tr: {
    nav: {
      today: "Bugün",
      goal: "Hedef",
      train: "Antrenman",
      meals: "Beslenme",
      gps: "GPS & Rota",
      coach: "Koç",
      profile: "Profil",
      menu: "Menü",
      logout: "Çıkış Yap",
      subtitle: "Kişisel antrenman defteri.",
    },
    today: {
      targetCal: "Hedef Bütçe",
      consumed: "Alınan",
      remaining: "Kalan",
      burned: "Yakılan",
    },
    meals: {
      title: "Beslenme & Öğün Takibi",
      desc: "Günlük kalori bütçeni kontrol et, pratik butonlarla veya serbestçe öğünlerini kaydet.",
      quickAdd: "Sık Tüketilen Besinler (Hızlı Ekle)",
      oneTouch: "Tek dokunuş",
      aiInputTitle: "Akıllı Öğün Girişi",
      aiInputDesc: "Miktar ve yiyecek yaz (örn: 2 dilim tam buğday ekmeği):",
      aiInputPlaceholder: "Örn: 1 kase mercimek çorbası",
      calcAndAdd: "Hesapla ve Ekle",
      calculating: "Hesaplanıyor...",
      manualTitle: "Hızlı Manuel Giriş",
      manualDesc: "Paket üzerindeki kaloriye göre hızlı ekle:",
      mealName: "Yemek adı",
      manualAddBtn: "+ Manuel Ekle",
      todayMeals: "Bugün Tüketilenler",
      noMeals: "Bugün henüz bir öğün girmedin. Yukarıdaki butonlardan hızlıca ekleyebilirsin.",
    },
    common: {
      kcal: "kcal",
      added: "eklendi",
      deleted: "silindi",
    },
  },
  en: {
    nav: {
      today: "Today",
      goal: "Goal",
      train: "Training",
      meals: "Nutrition",
      gps: "GPS & Route",
      coach: "Coach",
      profile: "Profile",
      menu: "Menu",
      logout: "Log Out",
      subtitle: "Personal workout logbook.",
    },
    today: {
      targetCal: "Calorie Budget",
      consumed: "Consumed",
      remaining: "Remaining",
      burned: "Burned",
    },
    meals: {
      title: "Nutrition & Meal Tracker",
      desc: "Track your daily calorie budget, log meals easily with quick shortcuts or manual entry.",
      quickAdd: "Frequent Foods (Quick Add)",
      oneTouch: "One tap",
      aiInputTitle: "Smart Meal Entry",
      aiInputDesc: "Enter food and portion (e.g., 2 slices whole wheat bread):",
      aiInputPlaceholder: "e.g., 1 bowl lentil soup",
      calcAndAdd: "Calculate & Add",
      calculating: "Calculating...",
      manualTitle: "Quick Manual Entry",
      manualDesc: "Log directly from nutrition label:",
      mealName: "Meal name",
      manualAddBtn: "+ Manual Add",
      todayMeals: "Today's Meals",
      noMeals: "No meals logged today yet. Use quick buttons above to start.",
    },
    common: {
      kcal: "kcal",
      added: "added",
      deleted: "deleted",
    },
  },
};

const kaydedilmisDil = (typeof window !== "undefined" ? localStorage.getItem("scoutfit_lang") : null) as Dil;
const varsayilanDil: Dil = kaydedilmisDil === "en" ? "en" : "tr";

interface I18nStore {
  dil: Dil;
  diliDegistir: (dil: Dil) => void;
  t: SozlukYapisi;
}

export const useI18n = create<I18nStore>((set) => ({
  dil: varsayilanDil,
  diliDegistir: (yeniDil: Dil) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("scoutfit_lang", yeniDil);
    }
    set({ dil: yeniDil, t: SOZLUK[yeniDil] });
  },
  t: SOZLUK[varsayilanDil],
}));