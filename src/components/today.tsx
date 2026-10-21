import { fmtKcal, fmtKg, profildenHesap, tempoCumlesi } from "@/lib/engine";
import { useFit } from "@/lib/store";
import type { Section } from "@/components/shell";
import { Btn, PageTitle, Panel, Row } from "@/components/ui";
import { DietStreakCard } from "./dietStreakCard";

function tarihKisa(iso: string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short" }).format(new Date(iso));
}

export function TodayView({ git }: { git: (s: Section) => void }) {
  const profil = useFit((s) => s.profil);
  const antrenmanlar = useFit((s) => s.antrenmanlar).slice(0, 3);
  const h = profil ? profildenHesap(profil) : null;

  return (
    <div>
      <PageTitle
        index="01"
        title="Bugün"
        lede="Tek bakışta kalori, tempo ve son antrenman. Başka bir şey yok."
      />

      <div className="space-y-6">
        {/* Günün Diyet Durumu ve Seri Takibi */}
        <DietStreakCard />

        {!profil || !h ? (
          <Panel>
            <div className="py-6">
              <p className="text-sm text-muted">Önce ölçülerini kaydet.</p>
              <div className="mt-5">
                <Btn onClick={() => git("goal")}>Hedefe git</Btn>
              </div>
            </div>
          </Panel>
        ) : (
          <>
            <Panel title="Hedef">
              <Row label="Kilo" value={fmtKg(profil.kilo)} />
              <Row label="Hedef kilo" value={fmtKg(profil.hedefKilo)} />
              <Row label="Günlük kalori" value={fmtKcal(h.gunlukKalori)} />
              <p className="py-4 text-sm text-muted">{tempoCumlesi(h)}</p>
            </Panel>

            <Panel title="Son antrenmanlar">
              {antrenmanlar.length === 0 ? (
                <div className="py-6">
                  <p className="text-sm text-muted">Henüz antrenman yok.</p>
                  <div className="mt-5">
                    <Btn onClick={() => git("train")}>Antrenmana git</Btn>
                  </div>
                </div>
              ) : (
                antrenmanlar.map((a) => (
                  <Row
                    key={a.id}
                    label={`${tarihKisa(a.tarih)} · ${a.bolge}`}
                    value={`${a.sureDk} dk`}
                  />
                ))
              )}
            </Panel>
          </>
        )}
      </div>
    </div>
  );
}