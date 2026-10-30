import React, { useState } from "react";
import {
  CalendarDays,
  Dumbbell,
  UtensilsCrossed,
  User,
  MessageSquare,
  Settings,
} from "lucide-react";
import { TodayView } from "./today";
import { TrainView } from "./train";
import { MealsView } from "./meals";
import { ProfilView } from "./profile";
import { CoachView } from "./coach";
import { GoalView } from "./goal";
import { SettingsModal } from "./settingsModal";

export type Section = "today" | "train" | "meals" | "profile" | "coach" | "goal";

export function Shell() {
  const [activeTab, setActiveTab] = useState<Section>("today");
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-pine selection:text-paper">
      {/* ÜST BAR (Status Bar çakışmasını kesin engelleyen güvenli boşluk) */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-md pt-10 sm:pt-4 px-5 pb-3 transition-colors">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pine text-paper font-serif font-bold text-sm shadow-sm">
              SF
            </div>
            <div>
              <span className="font-serif text-lg font-bold tracking-tight text-ink block leading-none">
                ScoutFit
              </span>
              <span className="text-[11px] text-muted block mt-0.5 leading-none">
                Antrenman & Beslenme Günlüğü
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-muted hover:text-ink hover:border-muted/40 transition-colors"
            aria-label="Ayarlar"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ANA İÇERİK (Alt çubuğun içeriği örtmemesi için alt padding) */}
      <main className="flex-1 px-4 pt-4 pb-28 mx-auto w-full max-w-lg">
        {activeTab === "today" && <TodayView git={setActiveTab} />}
        {activeTab === "train" && <TrainView />}
        {activeTab === "meals" && <MealsView git={setActiveTab} />}
        {activeTab === "profile" && <ProfilView git={setActiveTab} />}
        {activeTab === "coach" && <CoachView />}
        {activeTab === "goal" && <GoalView />}
      </main>

      {/* KOÇ BUTONU (Yüzen Eylem Butonu) */}
      {activeTab !== "coach" && (
        <button
          type="button"
          onClick={() => setActiveTab("coach")}
          className="fixed right-5 bottom-24 z-40 flex items-center gap-2 rounded-full bg-pine px-4 py-2.5 text-[13px] font-medium text-paper shadow-lg hover:opacity-95 active:scale-95 transition-all"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Koç</span>
        </button>
      )}

      {/* ALT GEZİNME ÇUBUĞU */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-line bg-paper/95 backdrop-blur-md pb-6 pt-2 px-3">
        <div className="mx-auto flex max-w-lg items-center justify-around">
          {[
            { id: "today", label: "Bugün", Icon: CalendarDays },
            { id: "train", label: "Antrenman", Icon: Dumbbell },
            { id: "meals", label: "Beslenme", Icon: UtensilsCrossed },
            { id: "profile", label: "Profil", Icon: User },
          ].map(({ id, label, Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as Section)}
                className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? "text-pine font-medium" : "text-muted hover:text-ink"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.2]" : "stroke-[1.6]"}`} />
                <span className="text-[11px] leading-none">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* AYARLAR PENCERESİ */}
      <SettingsModal acik={settingsOpen} kapat={() => setSettingsOpen(false)} />
    </div>
  );
}

// Router'daki ScoutApp import uyumluluğu için alias
export { Shell as ScoutApp };