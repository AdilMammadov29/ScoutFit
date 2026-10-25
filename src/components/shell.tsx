import { useState } from "react";
import { CoachView } from "@/components/coach";
import { GoalView } from "@/components/goal";
import { MealsView } from "@/components/meals";
import { TodayView } from "@/components/today";
import { TrainView } from "@/components/train";
import { ProfilView } from "./profile";
import { SettingsModal } from "./settingsModal";
import { useAuth } from "../lib/authStore";
import { AuthView } from "./auth";
import { supabase } from "@/lib/supabase";
import { bulutuDurdur } from "@/lib/sync";

export type Section = "today" | "train" | "meals" | "profile" | "goal";

const NAV: { id: "today" | "train" | "meals" | "profile"; no: string; ad: string; icon: string }[] = [
  { id: "today", no: "01", ad: "Bugün", icon: "⚡" },
  { id: "train", no: "02", ad: "Antrenman & GPS", icon: "🔥" },
  { id: "meals", no: "03", ad: "Beslenme", icon: "🥗" },
  { id: "profile", no: "04", ad: "Profil & Hedef", icon: "👤" },
];

export function ScoutApp() {
  const currentUser = useAuth((s: any) => s.currentUser);
  const [section, setSection] = useState<Section>("today");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [coachOpen, setCoachOpen] = useState(false);

  const handleCikis = async () => {
    bulutuDurdur();
    (useAuth as any).setState({ currentUser: null });
    await supabase.auth.signOut();
  };

  if (!currentUser) {
    return <AuthView />;
  }

  return (
    <div className="min-h-dvh bg-paper text-ink flex flex-col font-sans">
      {/* Üst Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-5 py-3.5 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pine flex items-center justify-center text-cream font-bold text-sm shadow-sm">
            S
          </div>
          <div>
            <span className="font-display text-lg font-bold text-pine block leading-tight">
              ScoutFit
            </span>
            <span className="text-[10px] text-muted">Kişisel Antrenman Defteri</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-1 rounded-xl border border-line bg-cream/50 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-cream transition-colors"
          >
            <span>⚙️</span>
            <span>Ayarlar</span>
          </button>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-10">
        <div className="mx-auto w-full max-w-2xl">
          <Icerik section={section} git={setSection} />
        </div>
      </main>

      {/* Yüzen AI Koç Butonu (Floating Action Button) */}
      <div className="fixed bottom-16 right-4 z-40 sm:bottom-20 sm:right-8">
        <button
          type="button"
          onClick={() => setCoachOpen(true)}
          className="flex items-center gap-2 rounded-full bg-pine px-4 py-3 text-cream shadow-lg hover:opacity-95 transition-all active:scale-95"
        >
          <span className="text-lg">🤖</span>
          <span className="text-xs font-bold hidden sm:inline">AI Koç</span>
        </button>
      </div>

      {/* AI Koç Modalı (Tam Ekran Kart) */}
      {coachOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6 backdrop-blur-sm animate-fade-in">
          <div className="relative flex h-full max-h-[640px] w-full max-w-2xl flex-col rounded-3xl border border-line bg-paper shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5 bg-cream/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h3 className="font-display text-base font-bold text-ink leading-tight">
                    Scout AI Koç
                  </h3>
                  <span className="text-[10px] text-muted">Performans Asistanı</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCoachOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-cream text-sm text-muted hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <CoachView />
            </div>
          </div>
        </div>
      )}

      {/* Modern 4'lü Alt Navigasyon Barı (Mobil Uyumlu) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-paper/95 backdrop-blur px-3 py-2">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {NAV.map((item) => {
            const aktif = section === item.id || (item.id === "profile" && section === "goal");
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`relative flex flex-col items-center justify-center px-3 py-1 transition-all ${
                  aktif ? "text-pine font-bold" : "text-muted hover:text-ink"
                }`}
              >
                <span className={`text-xl transition-transform ${aktif ? "scale-110" : "scale-100 opacity-70"}`}>
                  {item.icon}
                </span>
                <span className="mt-0.5 text-[10px] tracking-tight">{item.ad}</span>
                {aktif && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-pine" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <SettingsModal
        acik={settingsOpen}
        kapat={() => setSettingsOpen(false)}
      />
    </div>
  );
}

function Icerik({ section, git }: { section: Section; git: (s: Section) => void }) {
  if (section === "today") return <TodayView git={git} />;
  if (section === "goal") return <GoalView />;
  if (section === "train") return <TrainView />;
  if (section === "meals") return <MealsView git={git} />;
  if (section === "profile") {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => git("goal")}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-cream/40 px-3 py-1.5 text-xs font-semibold text-pine hover:bg-cream"
          >
            <span>🎯</span>
            <span>Hedef & Kilo Projeksiyonu</span>
          </button>
        </div>
        <ProfilView git={git} />
      </div>
    );
  }
  return <TodayView git={git} />;
}