import React, { useState } from "react";
import { useAuth } from "../lib/authStore";
import { useEkstra } from "../lib/extras";
import { useFit } from "../lib/store";
import { useSettingsStore } from "../lib/settingsStore";
import { tumVeriyiSifirla, cikisYap } from "@/lib/sync";
import { supabase } from "../lib/supabase";
import {
  X,
  User,
  LogOut,
  Trash2,
  Sliders,
  Smartphone,
  RotateCcw,
  AlertCircle,
  Check,
} from "lucide-react";

interface SettingsModalProps {
  acik: boolean;
  kapat: () => void;
}

export function SettingsModal({ acik, kapat }: SettingsModalProps) {
  const currentUser = useAuth((s: any) => s.currentUser);
  
  const logout = useAuth((s: any) => s.logout);
  
  const removeAccount = useAuth((s: any) => s.removeAccount);

  const birim = useEkstra((s: any) => s.birim);
  const setBirim = useEkstra((s: any) => s.setBirim);
  const tema = useEkstra((s: any) => s.tema);
  const setTema = useEkstra((s: any) => s.setTema);

  const temizleKilo = useEkstra((s: any) => s.temizleKilo);
  const temizleAntrenman = useFit((s: any) => s.temizleAntrenman);
  const temizleSohbet = useFit((s: any) => s.temizleSohbet);

  const settings = useSettingsStore((s) => s.settings);
  const updateSetting = useSettingsStore((s) => s.updateSetting);

  const [sifirlaOnay, setSifirlaOnay] = useState(false);
  const [siliniyor, setSiliniyor] = useState(false);

  if (!acik) return null;

  const sor = (mesaj: string, islem: () => void) => () => {
    if (window.confirm(mesaj)) islem();
  };

  const handleHesapSil = async () => {
    if (!currentUser) return;
    const onay = window.confirm(
      `"${currentUser.name}" adlı hesabı ve tüm verilerini kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz.`
    );
    if (!onay) return;

    setSiliniyor(true);
    try {
      if (supabase) {
        await supabase
          .from("kullanici_verisi")
          .delete()
          .eq("user_id", currentUser.id);
      }

      localStorage.removeItem(`scoutfit-store-${currentUser.id}`);
      localStorage.removeItem("scoutfit_onboarding_done");
      localStorage.removeItem(`scoutfit_onboarding_${currentUser.id}`);
      localStorage.removeItem("scoutfit_activity_v3");
      // Not: Supabase Auth kullanıcısını sunucu tarafında silmek gerekir (Edge Function).
      // Şimdilik sadece veri ve oturum temizleniyor.

      removeAccount(currentUser.id);
      logout();

      if (supabase) {
        await supabase.auth.signOut();
      }

      kapat();
      window.location.reload();
    } catch (err) {
      console.error("Hesap silinirken hata oluştu:", err);
      alert("Hesap silinirken bir sorun oluştu.");
    } finally {
      setSiliniyor(false);
    }
  };

  const handleSifirla = () => {
    if (sifirlaOnay) {
      tumVeriyiSifirla();
      setSifirlaOnay(false);
      kapat();
    } else {
      setSifirlaOnay(true);
    }
  };

  const handleCikis = async () => {
    let sonuc = await cikisYap();
    if (sonuc === "kaydedilemedi") {
      if (!window.confirm("Son değişiklikler buluta kaydedilemedi. Yine de çıkılsın mı?")) return;
      await cikisYap(true);
    }
    window.location.reload(); // bellekteki tüm store'ları sıfırlar
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm font-sans">
      <div className="w-full max-w-lg rounded-xl border border-line bg-surface p-5 shadow-lg max-h-[88vh] overflow-y-auto">
        {/* Üst Başlık */}
        <div className="flex items-center justify-between border-b border-line pb-3.5">
          <div>
            <h2 className="font-serif text-lg font-bold text-ink">Uygulama Ayarları</h2>
            <span className="text-[12px] text-muted block mt-0.5">
              Hesap, donanım ve veri tercihleri
            </span>
          </div>
          <button
            type="button"
            onClick={kapat}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-paper border border-line text-muted hover:text-ink transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-6 py-4">
          {/* 1. Hesap Yönetimi */}
          <div>
            <div className="flex items-center gap-1.5 mb-2.5">
              <User className="w-4 h-4 text-muted" />
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted">
                Hesap Yönetimi
              </p>
            </div>

            {currentUser && (
              <div className="rounded-xl border border-line bg-paper/60 p-3 mb-3">
                <span className="text-[12px] text-muted block">Aktif Profil</span>
                <span className="font-serif text-base font-bold text-ink mt-0.5 block">
                  {currentUser.name}
                </span>
              </div>
            )}


            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleCikis}
                className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line bg-paper px-3.5 py-2 text-[13px] font-medium text-ink hover:border-muted/40 transition-colors"
              >
                <LogOut className="w-4 h-4 text-muted" />
                <span>Çıkış Yap / Değiştir</span>
              </button>
              {currentUser && (
                <button
                  type="button"
                  disabled={siliniyor}
                  onClick={handleHesapSil}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-clay/30 bg-clay/5 px-3.5 py-2 text-[13px] font-medium text-clay hover:bg-clay/10 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{siliniyor ? "Siliniyor..." : "Hesabı Sil"}</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. Görünüm ve Birimler */}
          <div className="border-t border-line pt-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Sliders className="w-4 h-4 text-muted" />
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted">
                Görünüm ve Birimler
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-[12px] text-muted">Ağırlık ve Mesafe Birimi</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBirim("kg")}
                    className={`min-h-[44px] rounded-xl text-[13px] font-medium transition-colors ${
                      birim === "kg"
                        ? "bg-pine text-paper"
                        : "border border-line bg-paper text-ink hover:border-muted/40"
                    }`}
                  >
                    kg / km
                  </button>
                  <button
                    type="button"
                    onClick={() => setBirim("lb")}
                    className={`min-h-[44px] rounded-xl text-[13px] font-medium transition-colors ${
                      birim === "lb"
                        ? "bg-pine text-paper"
                        : "border border-line bg-paper text-ink hover:border-muted/40"
                    }`}
                  >
                    lb / mil
                  </button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[12px] text-muted">Arayüz Teması</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTema("acik")}
                    className={`min-h-[44px] rounded-xl text-[13px] font-medium transition-colors ${
                      tema === "acik"
                        ? "bg-pine text-paper"
                        : "border border-line bg-paper text-ink hover:border-muted/40"
                    }`}
                  >
                    Açık
                  </button>
                  <button
                    type="button"
                    onClick={() => setTema("koyu")}
                    className={`min-h-[44px] rounded-xl text-[13px] font-medium transition-colors ${
                      tema === "koyu"
                        ? "bg-pine text-paper"
                        : "border border-line bg-paper text-ink hover:border-muted/40"
                    }`}
                  >
                    Koyu
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Donanım ve Takip Tercihleri */}
          <div className="border-t border-line pt-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Smartphone className="w-4 h-4 text-muted" />
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted">
                Antrenman ve Donanım Tercihleri
              </p>
            </div>

            <div className="space-y-2">

              <div className="flex items-center justify-between rounded-xl border border-line bg-paper/60 p-3">
                <div>
                  <p className="text-[13px] font-medium text-ink">Sesli Geri Bildirim</p>
                  <p className="text-[11px] text-muted">Kilometre ve süre sesli anonsları</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting("voiceFeedback", !settings.voiceFeedback)}
                  className={`min-h-[36px] min-w-[72px] rounded-lg text-[12px] font-medium transition-colors ${
                    settings.voiceFeedback
                      ? "bg-pine text-paper"
                      : "border border-line bg-paper text-muted"
                  }`}
                >
                  {settings.voiceFeedback ? "Açık" : "Kapalı"}
                </button>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-line bg-paper/60 p-3">
                <div>
                  <p className="text-[13px] font-medium text-ink">Titreşim (Haptic)</p>
                  <p className="text-[11px] text-muted">Başlatma, durdurma ve kilometre bildirimleri</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateSetting("haptics", !settings.haptics)}
                  className={`min-h-[36px] min-w-[72px] rounded-lg text-[12px] font-medium transition-colors ${
                    settings.haptics
                      ? "bg-pine text-paper"
                      : "border border-line bg-paper text-muted"
                  }`}
                >
                  {settings.haptics ? "Açık" : "Kapalı"}
                </button>
              </div>
            </div>
          </div>

          {/* 4. Veri ve Sıfırlama */}
          <div className="border-t border-line pt-4">
            <div className="flex items-center gap-1.5 mb-2.5">
              <RotateCcw className="w-4 h-4 text-muted" />
              <p className="text-[12px] font-semibold uppercase tracking-wider text-muted">
                Veri ve Sıfırlama
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={sor("Tüm antrenman geçmişi silinsin mi?", temizleAntrenman)}
                className="min-h-[44px] rounded-xl border border-line bg-paper px-3 py-2 text-[12px] font-medium text-muted hover:text-clay hover:border-clay/40 transition-colors"
              >
                Antrenmanları Temizle
              </button>
              <button
                type="button"
                onClick={sor("Koç sohbet geçmişi silinsin mi?", temizleSohbet)}
                className="min-h-[44px] rounded-xl border border-line bg-paper px-3 py-2 text-[12px] font-medium text-muted hover:text-clay hover:border-clay/40 transition-colors"
              >
                Sohbeti Temizle
              </button>
              <button
                type="button"
                onClick={sor("Kayıtlı tüm kilo geçmişi silinsin mi?", temizleKilo)}
                className="min-h-[44px] rounded-xl border border-line bg-paper px-3 py-2 text-[12px] font-medium text-muted hover:text-clay hover:border-clay/40 transition-colors"
              >
                Kilo Geçmişini Sil
              </button>
              <button
                type="button"
                onClick={handleSifirla}
                className={`min-h-[44px] rounded-xl px-3 py-2 text-[12px] font-medium transition-colors ${
                  sifirlaOnay
                    ? "bg-clay text-paper"
                    : "border border-line bg-paper text-muted hover:text-clay hover:border-clay/40"
                }`}
              >
                {sifirlaOnay ? "Onaylamak için tekrar tıkla" : "Cihazdaki Tüm Veriyi Sıfırla"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}