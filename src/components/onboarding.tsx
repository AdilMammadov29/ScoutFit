import React, { useState } from "react";
import { useFit } from "@/lib/store";
import type { Cinsiyet, Aktivite, HedefSecim, Profil } from "@/lib/engine";
import { hesapla } from "@/lib/engine";
import { supabase } from "@/lib/supabase";
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

  // Form Alanları
  const [sex, setSex] = useState<Cinsiyet>("erkek");
  const [unitHeight, setUnitHeight] = useState<"cm" | "ft">("cm");
  const [heightCm, setHeightCm] = useState(180);
  const [unitWeight, setUnitWeight] = useState<"kg" | "lb">("kg");
  const [weightKg, setWeightKg] = useState(80);
  const [targetWeightKg, setTargetWeightKg] = useState(75);
  const [age, setAge] = useState(25);

  const [weightTrend, setWeightTrend] = useState<"losing" | "gaining" | "stable">("stable");
  const [exerciseDays, setExerciseDays] = useState<number>(4);
  const [activity, setActivity] = useState<Aktivite>("orta");
  const [liftingExp, setLiftingExp] = useState<string>("intermediate");
  const [goal, setGoal] = useState<HedefSecim>("yag_yakimi");
  const [dietStyle, setDietStyle] = useState<string>("balanced");
  const [calorieFloor, setCalorieFloor] = useState<"standard" | "low">("standard");
  const [trainingType, setTrainingType] = useState<string>("cardio_lifting");
  const [distribution, setDistribution] = useState<"even" | "shift">("even");

  const totalSteps = 16;

  const displayWeight = unitWeight === "kg" ? weightKg : Math.round(weightKg * 2.20462);
  const displayTargetWeight = unitWeight === "kg" ? targetWeightKg : Math.round(targetWeightKg * 2.20462);
  const displayFeetInches = cmToFeetInches(heightCm);

  const handleNext = async () => {
    if (step < totalSteps - 1) {
      setStep((prev) => prev + 1);
    } else {
      const profilVerisi: Profil = {
        boy: Number(heightCm) || 180,
        kilo: Number(weightKg) || 75,
        hedefKilo: Number(targetWeightKg) || Number(weightKg) || 75,
        yas: Number(age) || 25,
        cinsiyet: sex,
        aktivite: activity,
        hedef: goal,
      };

      // 1. Zustand Store güncelle
      useFit.setState({ profil: profilVerisi });
      try {
        useFit.getState().kaydetProfil(profilVerisi);
      } catch (err) {
        console.error("Store profil kaydetme hatası:", err);
      }

      // 2. Supabase kullanici_verisi jsonb alanına yaz
      try {
        if (supabase) {
          const { data: authData } = await supabase.auth.getUser();
          const userId = authData?.user?.id;
          if (userId) {
            const fitStore = useFit.getState();
            await supabase.from("kullanici_verisi").upsert(
              {
                user_id: userId,
                veri: {
                  fit: {
                    ...fitStore,
                    profil: profilVerisi,
                  },
                },
                guncellendi: new Date().toISOString(),
              },
              { onConflict: "user_id" },
            );
          }
        }
      } catch (dbErr) {
        console.error("Supabase profil senkronizasyon hatası:", dbErr);
      }

      // 3. Kalıcı bayrağı yerleştir ve bitir
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
    <div className="min-h-screen bg-paper text-ink flex flex-col justify-between select-none font-sans transition-colors duration-150">
      {/* Üst İlerleme Çubuğu */}
      <div className="w-full px-6 pt-6">
        <div className="flex items-center justify-between mb-4 h-8">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="text-muted hover:text-ink p-1 -ml-1 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-5 h-5" />
          )}
          <span className="text-[13px] font-medium text-muted">
            {step === 0
              ? ""
              : step <= 7
              ? isTr ? "Temel Bilgiler" : "Basics"
              : step <= 10
              ? isTr ? "Hedef Belirle" : "Set New Goal"
              : step <= 14
              ? isTr ? "Yeni Program" : "Set New Program"
              : isTr ? "Özet" : "Summary"}
          </span>
          <div className="w-5 h-5" />
        </div>

        {step > 0 && (
          <div className="w-full h-1 bg-surface rounded-full overflow-hidden border border-line/60">
            <div
              className="h-full bg-pine transition-all duration-300"
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
              <h1 className="font-serif text-3xl font-bold text-ink tracking-tight leading-tight">
                {isTr ? "Başlayalım" : "Let's Get Started"}
              </h1>
              <p className="text-muted text-[14px] mt-1">
                {isTr ? "Kişiselleştirilmiş programınız sizi bekliyor" : "Your personalized program awaits"}
              </p>
            </div>

            <div className="space-y-6 relative pl-3">
              <div className="absolute left-[22px] top-4 bottom-4 w-0.5 bg-line -z-0" />

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-pine text-paper font-serif font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                  1
                </div>
                <div>
                  <h3 className="font-serif font-bold text-ink text-base">
                    {isTr ? "Temel Bilgiler" : "Basics"}
                  </h3>
                  <p className="text-muted text-[13px] mt-0.5 leading-relaxed">
                    {isTr
                      ? "Sizi ve metabolizmanızı tanıyarak başlayacağız."
                      : "We'll start by learning about you and your metabolism."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-surface text-muted font-serif font-bold flex items-center justify-center text-sm shrink-0 border border-line">
                  2
                </div>
                <div>
                  <h3 className="font-serif font-bold text-ink text-base">
                    {isTr ? "Hedef" : "Goal"}
                  </h3>
                  <p className="text-muted text-[13px] mt-0.5">
                    {isTr ? "Kilo ve vücut hedefinizi belirleyin." : "Define your weight & fitness target."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-8 h-8 rounded-full bg-surface text-muted font-serif font-bold flex items-center justify-center text-sm shrink-0 border border-line">
                  3
                </div>
                <div>
                  <h3 className="font-serif font-bold text-ink text-base">
                    {isTr ? "Program" : "Program"}
                  </h3>
                  <p className="text-muted text-[13px] mt-0.5">
                    {isTr ? "Beslenme ve antrenman stilinizi özelleştirin." : "Customize your nutrition & training style."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
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
                  className={`w-full min-h-[44px] p-4 rounded-xl flex items-center justify-between transition-colors ${
                    sex === item.id
                      ? "bg-surface border-2 border-pine text-ink shadow-sm"
                      : "bg-surface border border-line text-muted hover:border-muted/40"
                  }`}
                >
                  <span className="font-serif font-semibold text-base">{item.label}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      sex === item.id ? "border-pine bg-pine" : "border-line"
                    }`}
                  >
                    {sex === item.id && <div className="w-2 h-2 rounded-full bg-paper" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
              {isTr ? "Yaşınız kaç?" : "What is your age?"}
            </h2>
            <div className="py-8 text-center">
              <div className="font-serif text-5xl font-bold text-ink tracking-tight">
                {age} <span className="text-lg text-muted font-sans">{isTr ? "yaş" : "years"}</span>
              </div>
              <input
                type="range"
                min="14"
                max="90"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full mt-8 accent-pine cursor-pointer"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
              {isTr ? "Boyunuz ne kadar?" : "What is your height?"}
            </h2>

            <div className="flex bg-surface p-1 rounded-xl border border-line w-fit mx-auto">
              <button
                onClick={() => setUnitHeight("ft")}
                className={`min-h-[36px] px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  unitHeight === "ft" ? "bg-pine text-paper" : "text-muted hover:text-ink"
                }`}
              >
                Feet & Inches
              </button>
              <button
                onClick={() => setUnitHeight("cm")}
                className={`min-h-[36px] px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  unitHeight === "cm" ? "bg-pine text-paper" : "text-muted hover:text-ink"
                }`}
              >
                Centimeters
              </button>
            </div>

            <div className="py-8 text-center">
              {unitHeight === "cm" ? (
                <div className="font-serif text-5xl font-bold text-ink tracking-tight">
                  {heightCm} <span className="text-lg text-muted font-sans">cm</span>
                </div>
              ) : (
                <div className="font-serif text-5xl font-bold text-ink tracking-tight">
                  {displayFeetInches.feet} <span className="text-lg text-muted font-sans">ft</span>{" "}
                  {displayFeetInches.inches} <span className="text-lg text-muted font-sans">in</span>
                </div>
              )}

              <input
                type="range"
                min="130"
                max="220"
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="w-full mt-8 accent-pine cursor-pointer"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
              {isTr ? "Mevcut kilonuz nedir?" : "What is your weight?"}
            </h2>

            <div className="flex bg-surface p-1 rounded-xl border border-line w-fit mx-auto">
              <button
                onClick={() => setUnitWeight("lb")}
                className={`min-h-[36px] px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  unitWeight === "lb" ? "bg-pine text-paper" : "text-muted hover:text-ink"
                }`}
              >
                Pounds
              </button>
              <button
                onClick={() => setUnitWeight("kg")}
                className={`min-h-[36px] px-4 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                  unitWeight === "kg" ? "bg-pine text-paper" : "text-muted hover:text-ink"
                }`}
              >
                Kilograms
              </button>
            </div>

            <div className="py-8 text-center">
              <div className="font-serif text-5xl font-bold text-ink tracking-tight">
                {displayWeight}{" "}
                <span className="text-lg text-muted font-sans">
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
                  }}
                  className="w-full mt-8 accent-pine cursor-pointer"
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
                  }}
                  className="w-full mt-8 accent-pine cursor-pointer"
                />
              )}
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
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
                  className={`w-full min-h-[44px] p-4 rounded-xl flex items-center justify-between transition-colors ${
                    weightTrend === item.id
                      ? "bg-surface border-2 border-pine text-ink shadow-sm"
                      : "bg-surface border border-line text-muted hover:border-muted/40"
                  }`}
                >
                  <span className="font-medium text-[14px]">{item.label}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      weightTrend === item.id ? "border-pine bg-pine" : "border-line"
                    }`}
                  >
                    {weightTrend === item.id && <div className="w-2 h-2 rounded-full bg-paper" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
                {isTr ? "Haftada ne sıklıkla egzersiz yapıyorsunuz?" : "How often do you exercise?"}
              </h2>
              <p className="text-[13px] text-muted mt-1">
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
                  className={`w-full min-h-[44px] p-4 rounded-xl flex items-center justify-between transition-colors ${
                    exerciseDays === item.val
                      ? "bg-surface border-2 border-pine text-ink shadow-sm"
                      : "bg-surface border border-line text-muted hover:border-muted/40"
                  }`}
                >
                  <span className="font-medium text-[14px]">{item.label}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      exerciseDays === item.val ? "border-pine bg-pine" : "border-line"
                    }`}
                  >
                    {exerciseDays === item.val && <div className="w-2 h-2 rounded-full bg-paper" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
                {isTr ? "Ne kadar aktifsiniz?" : "How active are you?"}
              </h2>
              <p className="text-[13px] text-muted mt-1">
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
                  className={`w-full min-h-[44px] p-4 rounded-xl flex items-center justify-between text-left transition-colors ${
                    activity === item.id
                      ? "bg-surface border-2 border-pine text-ink shadow-sm"
                      : "bg-surface border border-line text-muted hover:border-muted/40"
                  }`}
                >
                  <div>
                    <div className="font-serif font-semibold text-[14px] text-ink">{item.title}</div>
                    <div className="text-[12px] text-muted mt-0.5">{item.sub}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      activity === item.id ? "border-pine bg-pine" : "border-line"
                    }`}
                  >
                    {activity === item.id && <div className="w-2 h-2 rounded-full bg-paper" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 8 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
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
                  className={`w-full min-h-[44px] p-4 rounded-xl flex items-center justify-between text-left transition-colors ${
                    liftingExp === item.id
                      ? "bg-surface border-2 border-pine text-ink shadow-sm"
                      : "bg-surface border border-line text-muted hover:border-muted/40"
                  }`}
                >
                  <div>
                    <div className="font-serif font-semibold text-[14px] text-ink">{item.title}</div>
                    <div className="text-[12px] text-muted mt-0.5">{item.sub}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      liftingExp === item.id ? "border-pine bg-pine" : "border-line"
                    }`}
                  >
                    {liftingExp === item.id && <div className="w-2 h-2 rounded-full bg-paper" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 9 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
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
                  onClick={() => {
                    const g = item.id as HedefSecim;
                    setGoal(g);
                    if (g === "yag_yakimi" && targetWeightKg >= weightKg) {
                      setTargetWeightKg(Math.max(40, weightKg - 5));
                    } else if (g === "kas_kutlesi" && targetWeightKg <= weightKg) {
                      setTargetWeightKg(weightKg + 5);
                    } else if (g === "koruma") {
                      setTargetWeightKg(weightKg);
                    }
                  }}
                  className={`w-full min-h-[44px] p-4 rounded-xl flex items-center justify-between transition-colors ${
                    goal === item.id
                      ? "bg-surface border-2 border-pine text-ink shadow-sm"
                      : "bg-surface border border-line text-muted hover:border-muted/40"
                  }`}
                >
                  <span className="font-serif font-semibold text-base">{item.title}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      goal === item.id ? "border-pine bg-pine" : "border-line"
                    }`}
                  >
                    {goal === item.id && <div className="w-2 h-2 rounded-full bg-paper" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* HEDEF KİLO ADIMI */}
        {step === 10 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
                {isTr ? "Hedef kilonuz nedir?" : "What is your target weight?"}
              </h2>
              <p className="text-[13px] text-muted mt-1">
                {isTr ? "Ulaşmak istediğin nihai kilo hedefini belirle" : "Set the desired weight target"}
              </p>
            </div>

            <div className="py-8 text-center">
              <div className="font-serif text-5xl font-bold text-ink tracking-tight">
                {displayTargetWeight}{" "}
                <span className="text-lg text-muted font-sans">
                  {unitWeight === "kg" ? "kg" : "lbs"}
                </span>
              </div>

              {unitWeight === "kg" ? (
                <input
                  type="range"
                  min="40"
                  max="180"
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(Number(e.target.value))}
                  className="w-full mt-8 accent-pine cursor-pointer"
                />
              ) : (
                <input
                  type="range"
                  min="88"
                  max="400"
                  value={displayTargetWeight}
                  onChange={(e) => {
                    const valLbs = Number(e.target.value);
                    setTargetWeightKg(Math.round(valLbs / 2.20462));
                  }}
                  className="w-full mt-8 accent-pine cursor-pointer"
                />
              )}
            </div>
          </div>
        )}

        {step === 11 && (
          <div className="space-y-5 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
              {isTr ? "Hedef Özeti" : "Goal summary"}
            </h2>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-pine/10 border border-pine/30 flex justify-between items-center">
                <span className="text-[12px] font-medium tracking-wide text-pine">
                  {goal === "yag_yakimi"
                    ? isTr ? "Kilo Verme" : "Weight Loss"
                    : goal === "kas_kutlesi"
                    ? isTr ? "Kilo Alma" : "Weight Gain"
                    : isTr ? "Kiloyu Koruma" : "Weight Maintenance"}
                </span>
                <span className="font-serif font-bold text-ink text-sm">
                  {unitWeight === "kg"
                    ? `${weightKg} kg » ${targetWeightKg} kg`
                    : `${displayWeight} lbs » ${displayTargetWeight} lbs`}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-line space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted font-medium">
                    {isTr ? "Hedef Tempo" : "Goal Rate"}
                  </span>
                  <span className="font-serif text-sm font-bold text-ink">
                    {motorSonuc.haftalikKg < 0 ? "" : "+"}
                    {motorSonuc.haftalikKg} kg / {isTr ? "hf" : "wk"}
                  </span>
                </div>
                <p className="text-[12px] text-muted leading-relaxed">
                  {isTr
                    ? "Haftalık kalori hedefleriniz metabolizma harcamanıza göre otomatik ayarlanır."
                    : "Calorie targets are adjusted to keep you on track with your weekly rate."}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface border border-line space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-muted font-medium">
                    {isTr ? "Başlangıç Günlük Bütçesi" : "Initial Daily Budget"}
                  </span>
                  <span className="font-serif text-sm font-bold text-ink">
                    {motorSonuc.gunlukKalori} kcal
                  </span>
                </div>
                <p className="text-[12px] text-muted leading-relaxed">
                  {isTr
                    ? `Protein: ${motorSonuc.proteinG}g · Karb: ${motorSonuc.karbonhidratG}g · Yağ: ${motorSonuc.yagG}g`
                    : `Protein: ${motorSonuc.proteinG}g · Carbs: ${motorSonuc.karbonhidratG}g · Fat: ${motorSonuc.yagG}g`}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 12 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
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
                  className={`w-full min-h-[44px] p-4 rounded-xl flex items-center justify-between text-left transition-colors ${
                    dietStyle === item.id
                      ? "bg-surface border-2 border-pine text-ink shadow-sm"
                      : "bg-surface border border-line text-muted hover:border-muted/40"
                  }`}
                >
                  <div>
                    <div className="font-serif font-semibold text-[14px] text-ink">{item.title}</div>
                    <div className="text-[12px] text-muted mt-0.5">{item.sub}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      dietStyle === item.id ? "border-pine bg-pine" : "border-line"
                    }`}
                  >
                    {dietStyle === item.id && <div className="w-2 h-2 rounded-full bg-paper" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 13 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
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
                  className={`w-full min-h-[44px] p-4 rounded-xl flex items-center justify-between text-left transition-colors ${
                    calorieFloor === item.id
                      ? "bg-surface border-2 border-pine text-ink shadow-sm"
                      : "bg-surface border border-line text-muted hover:border-muted/40"
                  }`}
                >
                  <div>
                    <div className="font-serif font-semibold text-[14px] text-ink">{item.title}</div>
                    <div className="text-[12px] text-muted mt-0.5">{item.sub}</div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                      calorieFloor === item.id ? "border-pine bg-pine" : "border-line"
                    }`}
                  >
                    {calorieFloor === item.id && <div className="w-2 h-2 rounded-full bg-paper" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 14 && (
          <div className="space-y-6 animate-fadeIn">
            <h2 className="font-serif text-2xl font-bold text-ink tracking-tight">
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
                  className={`w-full min-h-[44px] p-4 rounded-xl flex items-center justify-between transition-colors ${
                    trainingType === item.id
                      ? "bg-surface border-2 border-pine text-ink shadow-sm"
                      : "bg-surface border border-line text-muted hover:border-muted/40"
                  }`}
                >
                  <span className="font-serif font-semibold text-[14px] text-ink">{item.title}</span>
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      trainingType === item.id ? "border-pine bg-pine" : "border-line"
                    }`}
                  >
                    {trainingType === item.id && <div className="w-2 h-2 rounded-full bg-paper" />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 15 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="font-serif text-3xl font-bold text-ink tracking-tight">
                {isTr ? "Neler Kazanacaksınız" : "What You Get"}
              </h1>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center shrink-0 text-pine border border-line">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-ink text-[14px]">
                    {isTr ? "Kişiye Özel Beslenme Planı" : "Custom diet plan for crushing your goal"}
                  </h4>
                  <p className="text-[12px] text-muted mt-0.5 leading-relaxed">
                    {isTr
                      ? "Bilimsel hesaplamayla oluşturulan kalori ve makro bütçesi."
                      : "Reach your goals faster with a smart, scientific plan made specifically for you."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center shrink-0 text-pine border border-line">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-ink text-[14px]">
                    {isTr ? "Anlık Besin Analizi" : "Calorie tracking"}
                  </h4>
                  <p className="text-[12px] text-muted mt-0.5 leading-relaxed">
                    {isTr
                      ? "Yediğini doğal dille yaz, kalorileri ve makroları anında dökülsün."
                      : "Simply type your food to calculate calories and nutrients."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center shrink-0 text-pine border border-line">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-ink text-[14px]">
                    {isTr ? "Metabolizmaya Uyarlanan Koçluk" : "Coaching calibrated to your metabolism"}
                  </h4>
                  <p className="text-[12px] text-muted mt-0.5 leading-relaxed">
                    {isTr
                      ? "Değişen kilonuza göre otomatik güncellenen dinamik haftalık hedefler."
                      : "Dynamic nutrition plan that automatically adjusts to your metabolism."}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center shrink-0 text-pine border border-line">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-semibold text-ink text-[14px]">
                    {isTr ? "Detaylı Makro Dağılımı" : "Detailed nutrient breakdowns"}
                  </h4>
                  <p className="text-[12px] text-muted mt-0.5 leading-relaxed">
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
      <div className="w-full px-6 pb-8 pt-4 bg-paper border-t border-line">
        <button
          onClick={handleNext}
          className="w-full min-h-[48px] rounded-xl bg-pine text-paper font-medium text-[14px] active:scale-[0.99] transition-all flex items-center justify-center shadow-sm hover:opacity-95"
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