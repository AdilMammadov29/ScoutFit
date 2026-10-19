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

// DİKKAT: "profile" sekmesini yan menüden çıkarttık, sağ üste avatar olarak koyacağız.
const NAV: { id: Section; no: string; ad: string; kisa: string }[] = [
  { id: "today", no: "01", ad: "Bugün", kisa: "Bugün" },
  { id: "goal", no: "02", ad: "Hedef", kisa: "Hedef" },
  { id: "train", no: "03", ad: "Antrenman", kisa: "Spor" },
  { id: "meals", no: "04", ad: "Beslenme", kisa: "Öğün" },
  { id: "coach", no: "05", ad: "Koç", kisa: "Koç" },
];

export function ScoutApp() {
  const currentUser = useAuth((s: any) => s.currentUser);
  const [section, setSection] = useState<Section>("today");
  const [menuOpen, setMenuOpen] = useState(false); // MOBİL MENÜ DURUMU

  // KULLANICI YOKSA GİRİŞ EKRANINI GÖSTER
  if (!currentUser) {
    return <AuthView />;
  }

  // AVATAR İÇİN BAŞ HARFİ ALALIM
  const basHarf = currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U";

  return (
    <div className="min-h-dvh bg-paper text-ink flex flex-col">
      {/* ÜST BAR VE AVATAR (Sağ Üst Profil) */}
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
        
        {/* AVATAR BUTONU */}
        <button
          onClick={() => setSection("profile")}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-bold transition-all hover:scale-105 active:scale-95 ${
            section === "profile" 
              ? "bg-pine text-cream ring-4 ring-pine/20" 
              : "border-2 border-pine/30 bg-cream text-pine"
          }`}
          title="Profile Git"
        >
          {basHarf}
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-stretch">
        
        {/* MOBİL ARKA PLAN KARARTMASI */}
        {menuOpen && (
          <div 
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden animate-fade-in" 
            onClick={() => setMenuOpen(false)} 
          />
        )}

        {/* YAN MENÜ (SIDEBAR) */}
        <aside 
          className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-paper px-6 py-8 transition-transform duration-300 md:static md:flex md:w-60 md:translate-x-0 ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-display text-3xl text-ink md:block hidden">ScoutFit</p>
              <p className="mt-2 hidden text-sm leading-relaxed text-muted md:block">Kişisel antrenman defteri.</p>
              <p className="font-display text-2xl text-ink md:hidden">Menü</p>
            </div>
            <button 
              className="text-2xl text-muted hover:text-ink md:hidden" 
              onClick={() => setMenuOpen(false)}
            >
              ✕
            </button>
          </div>

          <nav className="mt-10 flex flex-col gap-1" aria-label="Bölümler">
            {NAV.map((item) => {
              const aktif = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-current={aktif ? "page" : undefined}
                  onClick={() => {
                    setSection(item.id);
                    setMenuOpen(false); // Mobilde tıklayınca menüyü kapat
                  }}
                  className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors ${
                    aktif ? "bg-cream font-medium text-ink" : "text-muted hover:bg-cream/50"
                  }`}
                >
                  <span className="w-6 tabular-nums">{item.no}</span>
                  {item.ad}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ANA İÇERİK ALANI */}
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
  if (section === "profile") return <ProfilView git={git} />;
  return <CoachView />;
}