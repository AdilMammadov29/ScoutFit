import React, { useState } from "react";
import { useFit } from "@/lib/store";
import type { Cinsiyet, Aktivite, HedefSecim, Profil } from "@/lib/engine";
import { hesapla } from "@/lib/engine";
import { ArrowLeft, Flame, Sparkles, Activity, PieChart } from "lucide-react";

function cmToFeetInches(cm: number) {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function OnboardingView({ onComplete }: { onComplete: () => void }) {
  const isTr = typeof navigator !== "undefined" && navigator.language?.startsWith("tr");

  const [step, setStep] = useState(0);

  // Form Fields
  const [sex, setSex] = useState<Cinsiyet>("erkek");
  const [unitHeight, setUnitHeight] = useState<"cm" | "ft">("cm");
  const [heightCm, setHeightCm] = useState(180);
  const [unitWeight, setUnitWeight] = useState<"kg" | "lb">("kg");
  const [weightKg, setWeightKg] = useState(84);
  const [targetWeightKg, setTargetWeightKg] = useState(78);

  const [age] = useState(25);
  const [weightTrend, setWeightTrend] = useState<"losing" | "gaining" | "stable">("stable");
  const [exerciseDays, setExerciseDays] = useState<number>(4);
  const [activity, setActivity] = useState<Aktivite>("orta");
  const [liftingExp, setLiftingExp] = useState<string>("intermediate");
  const [goal, setGoal] = useState<HedefSecim>("yag_yakimi");
  const [dietStyle, setDietStyle] = useState<string>("balanced");
  const [calorieFloor, setCalorieFloor] = useState<"standard" | "low">("standard");
  const [trainingType, setTrainingType] = useState<string>("cardio_lifting");
  const [distribution, setDistribution] = useState<"even" | "shift">("even");

  const totalSteps = 15;

  const displayWeight = unitWeight === "kg" ? weightKg : Math.round(weightKg * 2.20462);
  const displayFeetInches = cmToFeetInches(heightCm);

  const handleNext = () => {
    if (step < totalSteps - 1) {
      setStep((prev) => prev + 1);
    } else {
      // 1. Profil nesnesini motorun tam istediği formatta oluştur
      const profilVerisi: Profil = {
        boy: Number(heightCm) || 180,
        kilo: Number(weightKg) || 75,
        hedefKilo: Number(targetWeightKg) || 70,
        yas: Number(age) || 25,
        cinsiyet: sex,
        aktivite: activity,
        hedef: goal,
      };

      // 2. Zustand store'una hem setState hem de kaydetProfil ile yaz
      useFit.setState({ profil: profilVerisi });
      try {
        useFit.getState().kaydetProfil(profilVerisi);
      } catch (err) {
        console.error("Store profil kaydetme hatası:", err);
      }

      // 3. Kalıcı kilidi koy ve içeri geçişi tetikle
      try {
        localStorage.setItem("scoutfit_onboarding_done", "true");
      } catch {}

      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep((prev) => prev - 1);
  };

  const motorSonuc = hesapla({
    boyCm: heightCm,
    kiloKg: weightKg,
    hedefKiloKg: targetWeightKg,
    yas: age,
    cinsiyet: sex,
    aktivite: activity,
    hedef: goal === "yag_yakimi" ? "kilo_verme" : goal === "kas_kutlesi" ? "kilo_alma" : "koruma",
  });

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 flex flex-col justify-between select-none">
      {/* Üst İlerleme Çubuğu */}
      <div className="w-full px-6 pt-6">
        <div className="flex items-center justify-between mb-4 h-8">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="text-zinc-400 hover:text-white p-1 -ml-1 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-5 h-5" />
          )}
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {step === 0
              ? ""
              : step <= 7
              ? isTr ? "Temel Bilgiler" : "Basics"
              : step <= 9
              ? isTr ? "Hedef Belirle" : "Set New Goal"
              : step <= 13
              ? isTr ? "Yeni Program" : "Set New Program"
              : isTr ? "Özet" : "Summary"}
          </span>
          <div className="w-5 h-5" />
        </div>

        {step > 0 && (
          <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-300"
              style={{ width: `${(step / (totalSteps - 1)) * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Ekran İçeriği */}
      <div className="flex-1 flex flex-col justify-center px-6 py-6 max-w-md w-full mx-auto">
        {step === 0 && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight uppercase font-sans">
                {isTr ? "BAŞLAYALIM" : "LET'S GET STARTED"}
              </h1>
              <p className="text-zinc-400 text-sm mt-1">
                {isTr ? "Kişiselleştirilmiş programınız sizi bekliyor" : "Your personalized program awaits"}
              </p>
            </div>

            <div className="space-y-6 relative pl-3">
              <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-zinc-800 -z-0" />

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-white text-black font-bold flex items-center justify-center text-sm shrink-0 shadow">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">
                    {isTr ? "Temel Bilgiler" : "Basics"}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">
                    {isTr
                      ? "Sizi ve metabolizmanızı tanıyarak başlayacağız."
                      : "We'll start by learning about you and your metabolism."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-sm shrink-0 border border-zinc-700">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">
                    {isTr ? "Hedef" : "Goal"}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    {isTr ? "Kilo ve vücut hedefinizi belirleyin." : "Define your weight & fitness target."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 font-bold flex items-center justify-center text-sm shrink-0 border border-zinc-700">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-white text-base">
                    {isTr ? "Program" : "Program"}
                  </h3>
                  <p className="text-zinc-400 text-xs mt-0.5">
                    {isTr ? "Beslenme ve antrenman stilinizi özelleştirin." : "Customize your nutrition & training style."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isTr ? "Biyolojik cinsiyetiniz nedir?" : "What is your sex?"}
            </h2>
            <div className="space-y-3">
              {[
                { id: "erkek", label: isTr ? "Erkek" : "Male" },
                { id: "kadin", label: isTr ? "Kadın" : "Female" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSex(item.id as Cinsiyet)}
                  className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all ${
                    sex === item.id
                      ? "bg-[#1c1c1e] border-2 border-white text-white shadow-md"
                      : "bg-[#18181a] border border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <span className="font-semibold text-base">{item.label}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      sex === item.id ? "border-white bg-white" : "border-zinc-600"
                    }`}
                  >
                    {sex === item.id && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isTr ? "Boyunuz ne kadar?" : "What is your height?"}
            </h2>

            <div className="flex bg-[#1c1c1e] p-1 rounded-xl border border-zinc-800 w-fit mx-auto">
              <button
                onClick={() => setUnitHeight("ft")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  unitHeight === "ft" ? "bg-white text-black" : "text-zinc-400"
                }`}
              >
                Feet & Inches
              </button>
              <button
                onClick={() => setUnitHeight("cm")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  unitHeight === "cm" ? "bg-white text-black" : "text-zinc-400"
                }`}
              >
                Centimeters
              </button>
            </div>

            <div className="py-8 text-center">
              {unitHeight === "cm" ? (
                <div className="text-5xl font-black text-white font-mono tracking-tight">
                  {heightCm} <span className="text-xl text-zinc-500 font-sans">cm</span>
                </div>
              ) : (
                <div className="text-5xl font-black text-white font-mono tracking-tight">
                  {displayFeetInches.feet} <span className="text-xl text-zinc-500 font-sans">ft</span>{" "}
                  {displayFeetInches.inches} <span className="text-xl text-zinc-500 font-sans">in</span>
                </div>
              )}

              <input
                type="range"
                min="130"
                max="220"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full mt-8 accent-white cursor-pointer"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isTr ? "Mevcut kilonuz nedir?" : "What is your weight?"}
            </h2>

            <div className="flex bg-[#1c1c1e] p-1 rounded-xl border border-zinc-800 w-fit mx-auto">
              <button
                onClick={() => setUnitWeight("lb")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  unitWeight === "lb" ? "bg-white text-black" : "text-zinc-400"
                }`}
              >
                Pounds
              </button>
              <button
                onClick={() => setUnitWeight("kg")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  unitWeight === "kg" ? "bg-white text-black" : "text-zinc-400"
                }`}
              >
                Kilograms
              </button>
            </div>

            <div className="py-8 text-center">
              <div className="text-5xl font-black text-white font-mono tracking-tight">
                {displayWeight}{" "}
                <span className="text-xl text-zinc-500 font-sans">
                  {unitWeight === "kg" ? "kg" : "lbs"}
                </span>
              </div>

              {unitWeight === "kg" ? (
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={weightKg}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWeightKg(val);
                    setTargetWeightKg(Math.max(40, val - 6));
                  }}
                  className="w-full mt-8 accent-white cursor-pointer"
                />
              ) : (
                <input
                  type="range"
                  min="88"
                  max="400"
                  value={displayWeight}
                  onChange={(e) => {
                    const valLbs = Number(e.target.value);
                    const valKg = Math.round(valLbs / 2.20462);
                    setWeightKg(valKg);
                    setTargetWeightKg(Math.max(40, valKg - 6));
                  }}
                  className="w-full mt-8 accent-white cursor-pointer"
                />
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isTr
                ? "Son birkaç haftadır kilonuz nasıl seyretti?"
                : "How has your weight trended for the past few weeks?"}
            </h2>
            <div className="space-y-3">
              {[
                { id: "losing", label: isTr ? "Kilo veriyordum" : "I have been losing weight" },
                { id: "gaining", label: isTr ? "Kilo alıyordum" : "I have been gaining weight" },
                { id: "stable", label: isTr ? "Kilom sabitti" : "I have been weight stable" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setWeightTrend(item.id as any)}
                  className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all ${
                    weightTrend === item.id
                      ? "bg-[#1c1c1e] border-2 border-white text-white"
                      : "bg-[#18181a] border border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <span className="font-semibold text-sm">{item.label}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      weightTrend === item.id ? "border-white bg-white" : "border-zinc-600"
                    }`}
                  >
                    {weightTrend === item.id && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {isTr ? "Haftada ne sıklıkla egzersiz yapıyorsunuz?" : "How often do you exercise?"}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {isTr
                  ? "Kardiyo, spor veya direnç antrenmanı seans sayısını tahmin edin"
                  : "Estimate recreational sports, cardio, or lifting sessions"}
              </p>
            </div>
            <div className="space-y-3">
              {[
                { val: 0, label: isTr ? "Haftada 0 seans" : "0 sessions / week" },
                { val: 2, label: isTr ? "Haftada 1-3 seans" : "1–3 sessions / week" },
                { val: 5, label: isTr ? "Haftada 4-6 seans" : "4–6 sessions / week" },
                { val: 7, label: isTr ? "Haftada 7+ seans" : "7+ sessions / week" },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => setExerciseDays(item.val)}
                  className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all ${
                    exerciseDays === item.val
                      ? "bg-[#1c1c1e] border-2 border-white text-white"
                      : "bg-[#18181a] border border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <span className="font-semibold text-sm">{item.label}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      exerciseDays === item.val ? "border-white bg-white" : "border-zinc-600"
                    }`}
                  >
                    {exerciseDays === item.val && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">
                {isTr ? "Ne kadar aktifsiniz?" : "How active are you?"}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {isTr ? "Egzersiz dışındaki günlük hareket düzeyiniz" : "Daily movement outside of workouts"}
              </p>
            </div>
            <div className="space-y-3">
              {[
                {
                  id: "hareketsiz",
                  title: isTr ? "Masa Başı / Hareketsiz" : "Mostly Sedentary",
                  sub: isTr ? "Günde 5.000 adımdan az" : "Commonly under 5,000 steps a day",
                },
                {
                  id: "orta",
                  title: isTr ? "Orta Düzeyde Aktif" : "Moderately Active",
                  sub: isTr ? "Günde 5.000 – 15.000 adım" : "Commonly 5,000 – 15,000 steps a day",
                },
                {
                  id: "aktif",
                  title: isTr ? "Çok Aktif" : "Very Active",
                  sub: isTr ? "Günde 15.000 adımdan fazla" : "Commonly more than 15,000 steps a day",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActivity(item.id as Aktivite)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all ${
                    activity === item.id
                      ? "bg-[#1c1c1e] border-2 border-white text-white"
                      : "bg-[#18181a] border border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{item.sub}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      activity === item.id ? "border-white bg-white" : "border-zinc-600"
                    }`}
                  >
                    {activity === item.id && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isTr ? "Ağırlık antrenmanı deneyiminiz?" : "What is your experience level with lifting?"}
            </h2>
            <div className="space-y-3">
              {[
                { id: "none", title: isTr ? "Hiç Yok" : "None", sub: isTr ? "Şu an ağırlık çalışmıyorum" : "Currently not lifting" },
                { id: "beginner", title: isTr ? "Başlangıç" : "Beginner", sub: isTr ? "1 yıldan azdır yapıyorum" : "Lifting for 1 year or less" },
                { id: "intermediate", title: isTr ? "Orta Seviye" : "Intermediate", sub: isTr ? "1 ile 4 yıl arası" : "1 to 4 years of lifting" },
                { id: "advanced", title: isTr ? "İleri Seviye" : "Advanced", sub: isTr ? "4 yıldan fazla" : "Lifting for 4+ years" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setLiftingExp(item.id)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all ${
                    liftingExp === item.id
                      ? "bg-[#1c1c1e] border-2 border-white text-white"
                      : "bg-[#18181a] border border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{item.sub}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      liftingExp === item.id ? "border-white bg-white" : "border-zinc-600"
                    }`}
                  >
                    {liftingExp === item.id && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isTr ? "Ana hedefiniz nedir?" : "What is your goal?"}
            </h2>
            <div className="space-y-3">
              {[
                { id: "yag_yakimi", title: isTr ? "Kilo Ver / Yağ Yakımı" : "Lose Weight" },
                { id: "koruma", title: isTr ? "Kiloyu Koru" : "Maintain Weight" },
                { id: "kas_kutlesi", title: isTr ? "Kilo Al / Kas Kütlesi" : "Gain Weight" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setGoal(item.id as HedefSecim)}
                  className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all ${
                    goal === item.id
                      ? "bg-[#1c1c1e] border-2 border-white text-white"
                      : "bg-[#18181a] border border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <span className="font-semibold text-base">{item.title}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      goal === item.id ? "border-white bg-white" : "border-zinc-600"
                    }`}
                  >
                    {goal === item.id && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isTr ? "Hedef Özeti" : "Goal summary"}
            </h2>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-[#17231c] border border-emerald-900/40 flex justify-between items-center">
                <span className="text-xs uppercase font-mono tracking-wider text-emerald-400">
                  {goal === "yag_yakimi"
                    ? isTr ? "Kilo Verme" : "Weight Loss"
                    : goal === "kas_kutlesi"
                    ? isTr ? "Kilo Alma" : "Weight Gain"
                    : isTr ? "Kiloyu Koruma" : "Weight Maintenance"}
                </span>
                <span className="font-bold text-white font-mono text-sm">
                  {unitWeight === "kg"
                    ? `${weightKg} kg » ${targetWeightKg} kg`
                    : `${displayWeight} lbs » ${Math.round(targetWeightKg * 2.20462)} lbs`}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-zinc-800/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-medium">
                    {isTr ? "Hedef Tempo" : "Goal Rate"}
                  </span>
                  <span className="text-sm font-bold text-white font-mono">
                    {motorSonuc.haftalikKg < 0 ? "" : "+"}
                    {motorSonuc.haftalikKg} kg / {isTr ? "hf" : "wk"}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  {isTr
                    ? "Haftalık kalori hedefleriniz metabolizma harcamanıza göre otomatik ayarlanır."
                    : "Calorie targets are adjusted to keep you on track with your weekly rate."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-zinc-800/80 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-zinc-400 font-medium">
                    {isTr ? "Başlangıç Günlük Bütçesi" : "Initial Daily Budget"}
                  </span>
                  <span className="text-sm font-bold text-white font-mono">
                    {motorSonuc.gunlukKalori} kcal
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  {isTr
                    ? `Protein: ${motorSonuc.proteinG}g · Karb: ${motorSonuc.karbonhidratG}g · Yağ: ${motorSonuc.yagG}g`
                    : `Protein: ${motorSonuc.proteinG}g · Carbs: ${motorSonuc.karbonhidratG}g · Fat: ${motorSonuc.yagG}g`}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 10 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isTr ? "Tercih ettiğiniz diyet türü?" : "What is your preferred diet?"}
            </h2>
            <div className="space-y-3">
              {[
                { id: "balanced", title: isTr ? "Dengeli" : "Balanced", sub: isTr ? "Standart karb ve yağ dağılımı" : "Standard distribution of carbs and fat" },
                { id: "low_fat", title: isTr ? "Düşük Yağ" : "Low-fat", sub: isTr ? "Yağ kısıtlanır, karb önceliklendirilir" : "Fat reduced to prioritize carbs" },
                { id: "low_carb", title: isTr ? "Düşük Karbonhidrat" : "Low-carb", sub: isTr ? "Karb kısıtlanır, protein ve yağ artırılır" : "Carbs reduced to prioritize protein and fat" },
                { id: "keto", title: isTr ? "Ketojenik" : "Keto", sub: isTr ? "Çok düşük karb, yüksek yağ" : "Very low carb, high fat" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDietStyle(item.id)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all ${
                    dietStyle === item.id
                      ? "bg-[#1c1c1e] border-2 border-white text-white"
                      : "bg-[#18181a] border border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{item.sub}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      dietStyle === item.id ? "border-white bg-white" : "border-zinc-600"
                    }`}
                  >
                    {dietStyle === item.id && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 11 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isTr ? "Hangi kalori tabanını tercih edersiniz?" : "What Calorie floor do you prefer?"}
            </h2>
            <div className="space-y-3">
              {[
                {
                  id: "standard",
                  title: isTr ? "Standart Taban" : "Standard Floor",
                  sub: isTr
                    ? "Önerileriniz asla güvenli BMR altına inmez"
                    : "Recommendations never drop below safe baseline",
                },
                {
                  id: "low",
                  title: isTr ? "Düşük Taban" : "Low Floor",
                  sub: isTr
                    ? "Daha agresif defisit (dikkatle uygulayın)"
                    : "More aggressive deficit (proceed with caution)",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCalorieFloor(item.id as any)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all ${
                    calorieFloor === item.id
                      ? "bg-[#1c1c1e] border-2 border-white text-white"
                      : "bg-[#18181a] border border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{item.sub}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      calorieFloor === item.id ? "border-white bg-white" : "border-zinc-600"
                    }`}
                  >
                    {calorieFloor === item.id && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 12 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isTr
                ? "Bu program boyunca ne tür antrenman yapacaksınız?"
                : "What training will you do during this program?"}
            </h2>
            <div className="space-y-3">
              {[
                { id: "none", title: isTr ? "Sadece Rahat Aktivite / Yürüyüş" : "None or Relaxed Activity" },
                { id: "lifting", title: isTr ? "Ağırlık Antrenmanı" : "Lifting" },
                { id: "cardio", title: isTr ? "Kardiyo" : "Cardio" },
                { id: "cardio_lifting", title: isTr ? "Kardiyo & Ağırlık" : "Cardio & Lifting" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTrainingType(item.id)}
                  className={`w-full p-5 rounded-2xl flex items-center justify-between transition-all ${
                    trainingType === item.id
                      ? "bg-[#1c1c1e] border-2 border-white text-white"
                      : "bg-[#18181a] border border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <span className="font-semibold text-sm">{item.title}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      trainingType === item.id ? "border-white bg-white" : "border-zinc-600"
                    }`}
                  >
                    {trainingType === item.id && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 13 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isTr
                ? "Kalori hedeflerini haftaya nasıl dağıtmak istersiniz?"
                : "How would you like to distribute Calorie targets throughout the week?"}
            </h2>
            <div className="space-y-3">
              {[
                {
                  id: "even",
                  title: isTr ? "Eşit Dağıt" : "Distribute Evenly",
                  sub: isTr
                    ? "Haftanın her günü aynı kalori hedefi"
                    : "Distribute your Calorie targets evenly across all days",
                },
                {
                  id: "shift",
                  title: isTr ? "Hedefleri Kaydır" : "Shift Calorie Targets",
                  sub: isTr
                    ? "Antrenman günlerinde daha yüksek, dinlenmede daha az"
                    : "Increase calories on specific workout days",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setDistribution(item.id as any)}
                  className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all ${
                    distribution === item.id
                      ? "bg-[#1c1c1e] border-2 border-white text-white"
                      : "bg-[#18181a] border border-zinc-800/80 text-zinc-300"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-sm">{item.title}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{item.sub}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      distribution === item.id ? "border-white bg-white" : "border-zinc-600"
                    }`}
                  >
                    {distribution === item.id && <div className="w-2 h-2 rounded-full bg-black" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 14 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight uppercase font-sans">
                {isTr ? "NELER KAZANACAKSINIZ" : "WHAT YOU GET"}
              </h1>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 text-white border border-zinc-700">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">
                    {isTr ? "Kişiye Özel Beslenme Planı" : "Custom diet plan for crushing your goal"}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    {isTr
                      ? "Bilimsel hesaplamayla oluşturulan kalori ve makro bütçesi."
                      : "Reach your goals faster with a smart, scientific plan made specifically for you."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 text-white border border-zinc-700">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">
                    {isTr ? "Yapay Zeka ile Anlık Besin Analizi" : "AI calorie tracking"}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    {isTr
                      ? "Yediğini doğal dille yaz, kalorileri ve makroları anında dökülsün."
                      : "Simply type your food, and AI calculates the calories and nutrients."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 text-white border border-zinc-700">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">
                    {isTr ? "Metabolizmaya Uyarlanan Koçluk" : "Coaching calibrated to your metabolism"}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    {isTr
                      ? "Değişen kilonuza göre otomatik güncellenen dinamik haftalık hedefler."
                      : "Dynamic nutrition plan that automatically adjusts to your metabolism."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 text-white border border-zinc-700">
                  <PieChart className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white text-sm">
                    {isTr ? "Detaylı Makro Dağılımı" : "Detailed nutrient breakdowns"}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    {isTr
                      ? "Protein, karbonhidrat ve yağ dengesini net olarak izleyin."
                      : "Track daily macros with rich analytics on intake and trends."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alt Buton Standardı */}
      <div className="w-full px-6 pb-8 pt-4 bg-[#121212]">
        <button
          onClick={handleNext}
          className="w-full h-14 rounded-2xl bg-white text-black font-semibold text-sm active:scale-[0.98] transition-all flex items-center justify-center shadow-lg"
        >
          {step === 0
            ? isTr ? "Temel Bilgilere Geç" : "Go to Basics"
            : step === totalSteps - 1
            ? isTr ? "Uygulamaya Başla" : "Get Started"
            : isTr ? "İleri" : "Next"}
        </button>
      </div>
    </div>
  );
}

export default OnboardingView;