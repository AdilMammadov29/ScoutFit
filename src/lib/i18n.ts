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
    subtitle: string;
    targetCal: string;
    consumed: string;
    remaining: string;
    burned: string;
    deficit: string;
    surplus: string;
    todaysWorkout: string;
    noWorkout: string;
    goToTrain: string;
    goToMeals: string;
    waterIntake: string;
    addWater: string;
    quickStats: string;
  };
  goal: {
    title: string;
    subtitle: string;
    currentWeight: string;
    targetWeight: string;
    height: string;
    age: string;
    activity: string;
    goalType: string;
    bulk: string;
    cut: string;
    maintain: string;
    calculate: string;
    bmr: string;
    tdee: string;
    dailyBudget: string;
    saveGoal: string;
    saved: string;
  };
  train: {
    title: string;
    subtitle: string;
    startWorkout: string;
    activeWorkout: string;
    finishWorkout: string;
    addExercise: string;
    exerciseName: string;
    weight: string;
    reps: string;
    addSet: string;
    completed: string;
    noExercises: string;
    volume: string;
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
  gps: {
    title: string;
    subtitle: string;
    startRun: string;
    stopRun: string;
    distance: string;
    pace: string;
    duration: string;
    caloriesBurned: string;
    gpsWaiting: string;
    routeTracking: string;
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
    delete: string;
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
      subtitle: "Günlük kalori dengen, makroların ve antrenman takibin.",
      targetCal: "Hedef Bütçe",
      consumed: "Alınan",
      remaining: "Kalan",
      burned: "Yakılan",
      deficit: "Defisit (Açık)",
      surplus: "Sürplus (Fazla)",
      todaysWorkout: "Bugünkü Antrenman",
      noWorkout: "Bugün henüz antrenman kaydı yok.",
      goToTrain: "Antrenmana Git",
      goToMeals: "Öğün Ekle",
      waterIntake: "Su Takibi",
      addWater: "+250 ml Ekle",
      quickStats: "Günlük Rapor",
    },
    goal: {
      title: "Hedef & Metabolizma",
      subtitle: "Kilona ve hedefine göre kalori ve makro oranlarını belirle.",
      currentWeight: "Mevcut Kilo",
      targetWeight: "Hedef Kilo",
      height: "Boy",
      age: "Yaş",
      activity: "Aktivite Seviyesi",
      goalType: "Hedef Türü",
      bulk: "Kas Kazanımı (Lean Bulk)",
      cut: "Yağ Yakımı (Defisit)",
      maintain: "Kilo Koruma",
      calculate: "Hesapla",
      bmr: "BMR (Bazal Metabolizma)",
      tdee: "TDEE (Günlük Harcama)",
      dailyBudget: "Hedef Günlük Kalori",
      saveGoal: "Hedefi Kaydet",
      saved: "Hedef başarıyla kaydedildi.",
    },
    train: {
      title: "Antrenman Günlüğü",
      subtitle: "Setlerini, ağırlıklarını ve tekrar sayılarını kaydet.",
      startWorkout: "Antrenmanı Başlat",
      activeWorkout: "Aktif Antrenman",
      finishWorkout: "Antrenmanı Bitir",
      addExercise: "+ Hareket Ekle",
      exerciseName: "Egzersiz Adı",
      weight: "Ağırlık",
      reps: "Tekrar",
      addSet: "+ Set Ekle",
      completed: "Tamamlandı",
      noExercises: "Henüz hareket eklenmedi. Başlamak için hareket ekle.",
      volume: "Toplam Hacim",
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
    gps: {
      title: "GPS & Rota Takibi",
      subtitle: "Koşu ve yürüyüş rotanı canlı izle, harcanan kaloriyi gör.",
      startRun: "Koşuyu Başlat",
      stopRun: "Bitir ve Kaydet",
      distance: "Mesafe",
      pace: "Tempo (Pace)",
      duration: "Süre",
      caloriesBurned: "Yakılan Kalori",
      gpsWaiting: "GPS konumu bekleniyor...",
      routeTracking: "Canlı Rota İzleniyor",
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
      delete: "Sil",
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
      subtitle: "Your daily energy balance, macros, and workout tracking.",
      targetCal: "Calorie Budget",
      consumed: "Consumed",
      remaining: "Remaining",
      burned: "Burned",
      deficit: "Deficit",
      surplus: "Surplus",
      todaysWorkout: "Today's Workout",
      noWorkout: "No workouts logged today yet.",
      goToTrain: "Go to Training",
      goToMeals: "Log Meal",
      waterIntake: "Water Intake",
      addWater: "+250 ml Add",
      quickStats: "Daily Stats",
    },
    goal: {
      title: "Goal & Metabolism",
      subtitle: "Configure calorie and macro ratios tailored to your body.",
      currentWeight: "Current Weight",
      targetWeight: "Target Weight",
      height: "Height",
      age: "Age",
      activity: "Activity Level",
      goalType: "Goal Type",
      bulk: "Muscle Gain (Lean Bulk)",
      cut: "Fat Loss (Deficit)",
      maintain: "Weight Maintenance",
      calculate: "Calculate",
      bmr: "BMR (Basal Metabolic Rate)",
      tdee: "TDEE (Total Daily Energy)",
      dailyBudget: "Target Daily Calories",
      saveGoal: "Save Goal",
      saved: "Goal saved successfully.",
    },
    train: {
      title: "Workout Log",
      subtitle: "Track sets, weights, and repetitions with precision.",
      startWorkout: "Start Workout",
      activeWorkout: "Active Session",
      finishWorkout: "Finish Workout",
      addExercise: "+ Add Exercise",
      exerciseName: "Exercise Name",
      weight: "Weight",
      reps: "Reps",
      addSet: "+ Add Set",
      completed: "Completed",
      noExercises: "No exercises added yet. Add an exercise to begin.",
      volume: "Total Volume",
    },
    meals: {
      title: "Nutrition & Meal Tracker",
      desc: "Track your daily calorie budget, log meals easily with quick shortcuts or manual entry.",
      targetBudget: "Calorie Budget",
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
    gps: {
      title: "GPS & Route Tracking",
      subtitle: "Track live running routes, pace, and real-time calorie burn.",
      startRun: "Start Run",
      stopRun: "Finish & Save",
      distance: "Distance",
      pace: "Pace",
      duration: "Duration",
      caloriesBurned: "Burned Calories",
      gpsWaiting: "Waiting for GPS signal...",
      routeTracking: "Live Route Active",
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
      delete: "Delete",
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