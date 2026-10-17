import { useState } from "react";
import { CoachView } from "@/components/coach";
import { GoalView } from "@/components/goal";
import { MealsView } from "@/components/meals";
import { TodayView } from "@/components/today";
import { TrainView } from "@/components/train";
import { ProfilView } from "./profile";
import { useAuth } from "../lib/authStore";
import { AuthView } from "./auth";
export type Section = "today" | "goal" | "train" | "meals" | "coach" | "profile";

const NAV: { id: Section; no: string; ad: string; kisa: string }[] = [
  { id: "today", no: "01", ad: "Bugün", kisa: "Bugün" },
  { id: "goal", no: "02", ad: "Hedef", kisa: "Hedef" },
  { id: "train", no: "03", ad: "Antrenman", kisa: "Spor" },
  { id: "meals", no: "04", ad: "Beslenme", kisa: "Öğün" },
  { id: "coach", no: "05", ad: "Koç", kisa: "Koç" },
  { id: "profile", no: "06", ad: "Profil", kisa: "Profil" }, 
];

export function ScoutApp() {
  const currentUser = useAuth((s) => s.currentUser);
  const [section, setSection] = useState<Section>("today");

  // KULLANICI YOKSA GİRİŞ EKRANINI GÖSTER
  if (!currentUser) {
    return <AuthView />;
  }

  return (
    <div className="min-h-dvh bg-paper text-ink">
      <div className="mx-auto flex min-h-dvh max-w-6xl">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-line px-6 py-8 md:flex">
          <p className="font-display text-3xl text-ink">ScoutFit</p>
          <p className="mt-2 text-sm leading-relaxed text-muted">Kişisel antrenman defteri.</p>
          <nav className="mt-10 flex flex-col gap-1" aria-label="Bölümler">
            {NAV.map((item) => {
              const aktif = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={aktif ? "page" : undefined}
                  onClick={() => setSection(item.id)}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm ${
                    aktif ? "bg-cream font-medium text-ink" : "text-muted"
                  }`}
                >
                  <span className="w-6 tabular-nums">{item.no}</span>
                  {item.ad}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 pb-28 md:px-10 md:pb-12">
          <div className="mx-auto w-full max-w-2xl">
            <Icerik section={section} git={setSection} />
          </div>
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 border-t border-line bg-cream md:hidden"
        aria-label="Bölümler"
      >
        <ul className="grid grid-cols-5">
          {NAV.map((item) => {
            const aktif = section === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  aria-current={aktif ? "page" : undefined}
                  onClick={() => setSection(item.id)}
                  className={`flex min-h-16 w-full flex-col items-center justify-center gap-0.5 text-xs ${
                    aktif ? "font-medium text-ink" : "text-muted"
                  }`}
                >
                  <span className="tabular-nums">{item.no}</span>
                  {item.kisa}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function Icerik({ section, git }: { section: Section; git: (s: Section) => void }) {
  if (section === "today") return <TodayView git={git} />;
  if (section === "goal") return <GoalView />;
  if (section === "train") return <TrainView />;
  if (section === "meals") return <MealsView git={git} />;
  if (section === "profile") return <ProfilView git={git} />; // BUNU EKLEDİK
  return <CoachView />;
}