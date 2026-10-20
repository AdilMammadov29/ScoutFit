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
    title: string;
    targetCal: string;
    consumed: string;
    remaining: string;
    burned: string;
    quickAdd: string;
    todaysWorkout: string;
    noWorkout: string;
  };
  meals: {
    title: string;
    desc: string;
    targetBudget: string;
    consumed: string;
    remaining: string;
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
  coach: {
    title: string;
    subtitle: string;
    statusReady: string;
    cheatTitle: string;
    cheatDesc: string;
    btnMissedWorkout: string;
    btnAteTooMuch: string;
    btnLowEnergy: string;
    btnResetDay: string;
    recentAdvice: string;
    aiThinking: string;
    emptyAdvice: string;
  };
  common: {
    kcal: string;
    kg: string;
    cm: string;
    sets: string;
    reps: string;
    save: string;
    cancel: string;
    close: string;
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
      title: "Günün Özeti",
      targetCal: "Hedef Bütçe",
      consumed: "Alınan",
      remaining: "Kalan",
      burned: "Yakılan",
      quickAdd: "Hızlı Ekle",
      todaysWorkout: "Bugünkü Antrenman",
      noWorkout: "Bugün planlanmış antrenman yok.",
    },
    meals: {
      title: "Beslenme & Öğün Takibi",
      desc: "Günlük kalori bütçeni kontrol et, pratik butonlarla veya serbestçe öğünlerini kaydet.",
      targetBudget: "Hedef Bütçe",
      consumed: "Alınan",
      remaining: "Kalan",
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
    coach: {
      title: "ScoutFit AI Koç",
      subtitle: "Performans, beslenme ve telafi asistanın.",
      statusReady: "Koç hazır, durumunu analiz ediyor",
      cheatTitle: "Hızlı Durum & Kaçamak Bildirimi",
      cheatDesc: "Hedefinin dışına çıktıysan endişelenme, durumu seç ve dengeleme planını al:",
      btnMissedWorkout: "🏋️‍♂️ Antrenmanı Kaçırdım",
      btnAteTooMuch: "🍕 Fazla Kalori / Kaçamak Yaptım",
      btnLowEnergy: "⚡ Enerjim Düşük / Yorgunum",
      btnResetDay: "🔄 Günü Dengele & Sıfırla",
      recentAdvice: "Koçun Stratejisi & Tavsiyeleri",
      aiThinking: "Koç senin için en iyi stratejiyi hesaplıyor...",
      emptyAdvice: "Yukarıdaki butonlardan bir durum seç veya durumunu paylaş, telafi stratejisi hemen oluşturulsun.",
    },
    common: {
      kcal: "kcal",
      kg: "kg",
      cm: "cm",
      sets: "Set",
      reps: "Tekrar",
      save: "Kaydet",
      cancel: "İptal",
      close: "Kapat",
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
      title: "Daily Summary",
      targetCal: "Target Budget",
      consumed: "Consumed",
      remaining: "Remaining",
      burned: "Burned",
      quickAdd: "Quick Add",
      todaysWorkout: "Today's Workout",
      noWorkout: "No workout scheduled for today.",
    },
    meals: {
      title: "Nutrition & Meal Tracker",
      desc: "Track your daily calorie budget, log meals easily with quick shortcuts or manual entry.",
      targetBudget: "Target Budget",
      consumed: "Consumed",
      remaining: "Remaining",
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
    coach: {
      title: "ScoutFit AI Coach",
      subtitle: "Your personal performance, nutrition & recovery assistant.",
      statusReady: "Coach is active and analyzing your data",
      cheatTitle: "Quick Status & Cheat Meal Log",
      cheatDesc: "Slipped off track? No worries. Select your situation to get an instant compensation plan:",
      btnMissedWorkout: "🏋️‍♂️ Missed My Workout",
      btnAteTooMuch: "🍕 Had a Cheat Meal / Overate",
      btnLowEnergy: "⚡ Low Energy / Fatigue",
      btnResetDay: "🔄 Balance & Reset Strategy",
      recentAdvice: "Coach Strategy & Recommendations",
      aiThinking: "Coach is calculating the optimal plan...",
      emptyAdvice: "Select an option above to generate a tailored adjustment and compensation plan.",
    },
    common: {
      kcal: "kcal",
      kg: "kg",
      cm: "cm",
      sets: "Sets",
      reps: "Reps",
      save: "Save",
      cancel: "Cancel",
      close: "Close",
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