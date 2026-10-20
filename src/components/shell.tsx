import { useState } from "react";
import { CoachView } from "@/components/coach";
import { GoalView } from "@/components/goal";
import { MealsView } from "@/components/meals";
import { TodayView } from "@/components/today";
import { TrainView } from "@/components/train";
import { ProfilView } from "./profile";
import { GpsTracker } from "./gps";
import { useAuth } from "../lib/authStore";
import { AuthView } from "./auth";
import { supabase } from "@/lib/supabase";
import { bulutuDurdur } from "@/lib/sync";

export type Section = "today" | "goal" | "train" | "meals" | "coach" | "profile" | "gps";

const NAV: { id: Section; no: string; ad: string }[] = [
  { id: "today", no: "01", ad: "Bugün" },
  { id: "goal", no: "02", ad: "Hedef" },
  { id: "train", no: "03", ad: "Antrenman" },
  { id: "meals", no: "04", ad: "Beslenme" },
  { id: "gps", no: "05", ad: "GPS & Rota" },
  { id: "coach", no: "06", ad: "Koç" },
];

export function ScoutApp() {
  const currentUser = useAuth((s: any) => s.currentUser);
  const [section, setSection] = useState<Section>("today");
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCikis = async () => {
    bulutuDurdur();
    (useAuth as any).setState({ currentUser: null });
    await supabase.auth.signOut();
  };

  if (!currentUser) {
    return <AuthView />;
  }

  const kullaniciAdi = typeof currentUser === "string" ? currentUser : currentUser.name || "Kullanıcı";
  const basHarf = (kullaniciAdi.charAt(0) || "U").toUpperCase();

  return (
    <div className="min-h-dvh bg-paper text-ink flex flex-col font-sans">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-paper/90 px-6 py-4 backdrop-blur md:px-10">
        <div className="flex items-center gap-4">
          <button 
            className="text-2xl text-pine md:hidden" 
            onClick={() => setMenuOpen(true)}
            aria-label="Menüyü aç"
          >
            ☰
          </button>
          <span className="font-display text-2xl font-bold text-pine md:hidden">ScoutFit</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSection("profile")}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95 ${
              section === "profile" 
                ? "bg-pine text-cream ring-4 ring-pine/20" 
                : "border border-line bg-cream text-pine"
            }`}
            title={`Profil (${kullaniciAdi})`}
          >
            {basHarf}
          </button>

          <button
            onClick={handleCikis}
            className="rounded-xl border border-line bg-cream px-3 py-2 text-xs font-semibold text-muted hover:border-clay/50 hover:text-clay transition-all active:scale-95"
            title="Çıkış Yap"
          >
            Çıkış Yap
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-stretch">
        {menuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in" 
            onClick={() => setMenuOpen(false)} 
          />
        )}

        <aside 
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col justify-between border-r border-line bg-paper px-6 py-8 transition-transform duration-300 md:static md:flex md:w-60 md:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display text-2xl font-bold text-ink md:block hidden">ScoutFit</p>
                <p className="mt-1 hidden text-xs leading-relaxed text-muted md:block">Kişisel antrenman defteri.</p>
                <p className="font-display text-xl font-bold text-ink md:hidden">Menü</p>
              </div>
              <button 
                className="text-2xl text-muted hover:text-ink md:hidden" 
                onClick={() => setMenuOpen(false)}
              >
                ✕
              </button>
            </div>

            <nav className="mt-8 flex flex-col gap-1" aria-label="Bölümler">
              {NAV.map((item) => {
                const aktif = section === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={aktif ? "page" : undefined}
                    onClick={() => {
                      setSection(item.id);
                      setMenuOpen(false);
                    }}
                    className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors ${
                      aktif ? "bg-cream font-medium text-ink" : "text-muted hover:bg-cream/50"
                    }`}
                  >
                    <span className="w-6 font-mono text-xs tabular-nums text-muted">{item.no}</span>
                    {item.ad}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="border-t border-line/60 pt-4 flex flex-col gap-2">
            <button
              onClick={handleCikis}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold text-muted hover:bg-clay/10 hover:text-clay transition-colors"
            >
              <span>🚪</span>
              <span>Çıkış Yap</span>
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 md:px-10">
          <div className="mx-auto w-full max-w-2xl">
            <Icerik section={section} git={setSection} />
          </div>
        </main>
      </div>
    </div>
  );
}

function Icerik({ section, git }: { section: Section; git: (s: Section) => void }) {
  if (section === "today") return <TodayView git={git} />;
  if (section === "goal") return <GoalView />;
  if (section === "train") return <TrainView />;
  if (section === "meals") return <MealsView git={git} />;
  if (section === "gps") return <GpsTracker />;
  if (section === "profile") return <ProfilView git={git} />;
  return <CoachView />;
}