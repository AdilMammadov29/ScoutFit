import { fmtKcal, fmtKg, profildenHesap, tempoCumlesi } from "@/lib/engine";
import { useFit } from "@/lib/store";
import type { Section } from "@/components/shell";
import { Btn, PageTitle, Panel, Row } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

function tarihKisa(iso: string, dil: "tr" | "en") {
  const locale = dil === "en" ? "en-US" : "tr-TR";
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(iso));
}

export function TodayView({ git }: { git: (s: Section) => void }) {
  const { dil, t } = useI18n();
  const profil = useFit((s) => s.profil);
  const antrenmanlar = useFit((s) => s.antrenmanlar).slice(0, 3);
  const h = profil ? profildenHesap(profil) : null;

  const tempoMetni = () => {
    if (!h || !profil) return "";
    if (dil === "en") {
      if (profil.hedefKilo > profil.kilo) return "Surplus targeted for lean muscle gain.";
      if (profil.hedefKilo < profil.kilo) return "Deficit targeted for steady fat loss.";
      return "Maintenance calories to preserve current physique.";
    }
    return tempoCumlesi(h);
  };

  return (
    <div>
      <PageTitle
        index="01"
        title={t.today.title}
        lede={t.today.subtitle}
      />

      {!profil || !h ? (
        <Panel>
          <div className="py-6">
            <p className="text-sm text-muted">
              {dil === "en" ? "Set your body metrics first." : "Önce ölçülerini kaydet."}
            </p>
            <div className="mt-5">
              <Btn onClick={() => git("goal")}>
                {dil === "en" ? "Go to Goals" : "Hedefe git"}
              </Btn>
            </div>
          </div>
        </Panel>
      ) : (
        <div className="space-y-6">
          <Panel title={t.nav.goal}>
            <Row 
              label={dil === "en" ? "Current Weight" : "Kilo"} 
              value={fmtKg(profil.kilo)} 
            />
            <Row 
              label={dil === "en" ? "Target Weight" : "Hedef kilo"} 
              value={fmtKg(profil.hedefKilo)} 
            />
            <Row 
              label={dil === "en" ? "Daily Calorie Target" : "Günlük kalori"} 
              value={fmtKcal(h.gunlukKalori)} 
            />
            <p className="py-4 text-sm text-muted">{tempoMetni()}</p>
          </Panel>

          <Panel title={t.today.todaysWorkout}>
            {antrenmanlar.length === 0 ? (
              <div className="py-6">
                <p className="text-sm text-muted">{t.today.noWorkout}</p>
                <div className="mt-5">
                  <Btn onClick={() => git("train")}>{t.today.goToTrain}</Btn>
                </div>
              </div>
            ) : (
              antrenmanlar.map((a) => (
                <Row
                  key={a.id}
                  label={`${tarihKisa(a.tarih, dil)} · ${a.bolge}`}
                  value={`${a.sureDk} ${dil === "en" ? "min" : "dk"}`}
                />
              ))
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}