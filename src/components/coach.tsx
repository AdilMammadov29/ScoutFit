import { useState } from "react";
import { PageTitle, Panel, Btn } from "./ui";
import { useI18n } from "@/lib/i18n";
import { useFit } from "@/lib/store";
import { useOgun } from "@/lib/ogun";

export function CoachView() {
  const { dil, t } = useI18n();
  const profil = useFit((s) => s.profil);
  const ogunler = useOgun((s) => s.ogunler);

  const [tavsiye, setTavsiye] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(false);

  const telafiUret = (tip: "kacirma" | "kacamak" | "yorgunluk" | "reset") => {
    setYukleniyor(true);
    setTavsiye(null);

    setTimeout(() => {
      if (dil === "en") {
        if (tip === "kacirma") {
          setTavsiye(
            "Don't worry about missing a session. Keep today's calorie intake at maintenance level. Tomorrow, combine your major compound lifts (Chest & Back or Squat & Shoulders) into a 45-minute focused session with 3 sets per movement."
          );
        } else if (tip === "kacamak") {
          setTavsiye(
            "A cheat meal will not ruin your progress. Drink at least 3.5 liters of water today to flush excess sodium. Deduct 200 kcal from carbohydrates over the next two days, and add a brisk 25-minute walk (approx. 200 kcal burn)."
          );
        } else if (tip === "yorgunluk") {
          setTavsiye(
            "Central nervous system fatigue detected. Skip heavy 1-5 rep max attempts today. Perform a deload session: reduce working weights by 30%, focus on slow tempo (3 seconds eccentric), and get at least 8 hours of sleep."
          );
        } else {
          setTavsiye(
            "Daily metrics reset. Hydration target set to 3L. Aim for 2.0g protein per kg of bodyweight, prioritize high-fiber vegetables, and get ready for your scheduled training split tomorrow."
          );
        }
      } else {
        if (tip === "kacirma") {
          setTavsiye(
            "Bir antrenmanı kaçırmak hiçbir şeyi bozmaz. Bugünkü kalori alımını bakım seviyesinde tut. Yarın ana bileşik hareketlerini (Göğüs-Sırt veya Bacak-Omuz) birleştirerek 45 dakikalık, hareket başına 3 setlik yoğun bir telafi antrenmanı yap."
          );
        } else if (tip === "kacamak") {
          setTavsiye(
            "Kaçamak kilo yapmaz, sadece su tutar. Bugün en az 3.5 litre su içerek sodyumu at. Önümüzdeki 2 gün karbonhidratı porsiyon başına 30-40g kıs ve günlük adımlarına 25 dakikalık tempolu yürüyüş ekle."
          );
        } else if (tip === "yorgunluk") {
          setTavsiye(
            "Merkezi sinir sistemi yorgunluğu tespit edildi. Bugün tükenişe (RPE 10) gitme. Ağırlıkları %30 düşürerek kan akışını artıran hafif bir 'deload' seansı yap ve bu gece 8 saat deliksiz uyu."
          );
        } else {
          setTavsiye(
            "Günün dengelendi. Su hedefin 3 litre. Vücut ağırlığının 2 katı protein almaya odaklan, lifli sebzelere öncelik ver ve yarınki antrenmanına sıfırdan odaklan."
          );
        }
      }
      setYukleniyor(false);
    }, 450);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        index="06"
        title={t.coach.title}
        lede={t.coach.subtitle}
      />

      {/* Koç Durum Rozeti */}
      <div className="flex items-center justify-between rounded-2xl border border-line bg-cream p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-3 w-3 items-center justify-center">
            <span className="absolute h-3 w-3 rounded-full bg-pine opacity-75 animate-ping" />
            <span className="relative h-2 w-2 rounded-full bg-pine" />
          </div>
          <span className="text-xs font-semibold text-ink">{t.coach.statusReady}</span>
        </div>
        <span className="text-xs font-mono text-muted uppercase">
          {dil === "en" ? "Live Analysis" : "Canlı Analiz"}
        </span>
      </div>

      {/* Kaçamak / Telafi Butonları */}
      <Panel>
        <div className="p-6">
          <h3 className="text-sm font-bold text-ink">{t.coach.cheatTitle}</h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">{t.coach.cheatDesc}</p>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => telafiUret("kacirma")}
              disabled={yukleniyor}
              className="rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-pine hover:bg-cream active:scale-95 text-xs font-bold text-ink"
            >
              {t.coach.btnMissedWorkout}
            </button>

            <button
              onClick={() => telafiUret("kacamak")}
              disabled={yukleniyor}
              className="rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-pine hover:bg-cream active:scale-95 text-xs font-bold text-ink"
            >
              {t.coach.btnAteTooMuch}
            </button>

            <button
              onClick={() => telafiUret("yorgunluk")}
              disabled={yukleniyor}
              className="rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-pine hover:bg-cream active:scale-95 text-xs font-bold text-ink"
            >
              {t.coach.btnLowEnergy}
            </button>

            <button
              onClick={() => telafiUret("reset")}
              disabled={yukleniyor}
              className="rounded-2xl border border-line bg-paper p-4 text-left transition hover:border-pine hover:bg-cream active:scale-95 text-xs font-bold text-ink"
            >
              {t.coach.btnResetDay}
            </button>
          </div>
        </div>
      </Panel>

      {/* Tavsiye & Çözüm Kartı */}
      <Panel>
        <div className="p-6">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-pine">
              {t.coach.recentAdvice}
            </span>
            {yukleniyor && (
              <span className="text-xs font-mono text-muted animate-pulse">
                {t.coach.aiThinking}
              </span>
            )}
          </div>

          <div className="mt-4">
            {tavsiye ? (
              <div className="rounded-2xl border border-pine/30 bg-pine/10 p-5 text-xs leading-relaxed text-ink font-medium animate-fade-in">
                <span className="font-bold text-pine block mb-1">
                  {dil === "en" ? "💡 Protocol:" : "💡 Çözüm Protokolü:"}
                </span>
                {tavsiye}
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-muted leading-relaxed">
                {t.coach.emptyAdvice}
              </p>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}