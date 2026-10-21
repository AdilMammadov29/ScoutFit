import React, { useState } from "react";
import { useAuth } from "../lib/authStore";
import { useEkstra } from "../lib/extras";
import { useFit } from "../lib/store";
import { useSettingsStore } from "../lib/settingsStore";
import { tumVeriyiSifirla } from "@/lib/sync";
import { Btn, Panel } from "./ui";

interface SettingsModalProps {
  acik: boolean;
  kapat: () => void;
}

export function SettingsModal({ acik, kapat }: SettingsModalProps) {
  const currentUser = useAuth((s: any) => s.currentUser);
  const accounts = useAuth((s: any) => s.accounts);
  const logout = useAuth((s: any) => s.logout);
  const switchAccount = useAuth((s: any) => s.switchAccount);
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

  if (!acik) return null;

  const sor = (mesaj: string, islem: () => void) => () => {
    if (window.confirm(mesaj)) islem();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-line bg-paper p-5 shadow-2xl max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-base font-semibold text-ink">Uygulama Ayarları</h2>
          <button
            onClick={kapat}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-muted hover:bg-cream hover:text-ink transition"
          >
            Kapat
          </button>
        </div>

        <div className="space-y-6 py-4">
          {/* Hesap Yönetimi */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Hesap Yönetimi</p>
            {currentUser && (
              <p className="text-sm text-muted mb-3">
                Aktif Hesap: <span className="font-medium text-ink">{currentUser.name}</span>
              </p>
            )}

            {accounts && accounts.length > 1 && (
              <div className="mb-3 space-y-2">
                <p className="text-xs text-muted">Kayıtlı Diğer Hesaplar</p>
                {accounts
                  .filter((a: any) => a.id !== currentUser?.id)
                  .map((acc: any) => (
                    <div
                      key={acc.id}
                      className="flex items-center justify-between rounded-xl border border-line bg-cream px-3 py-2"
                    >
                      <span className="text-xs text-ink">{acc.name}</span>
                      <button
                        onClick={() => switchAccount(acc.id)}
                        className="text-xs font-medium text-pine hover:underline"
                      >
                        Geçiş Yap
                      </button>
                    </div>
                  ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Btn tone="quiet" onClick={() => logout()}>
                Çıkış Yap / Hesap Değiştir
              </Btn>
              {currentUser && (
                <Btn
                  tone="quiet"
                  onClick={() => {
                    if (
                      window.confirm(
                        `"${currentUser.name}" adlı hesabı cihazdan kalıcı olarak silmek istediğine emin misin?`,
                      )
                    ) {
                      removeAccount(currentUser.id);
                    }
                  }}
                >
                  Hesabı Sil
                </Btn>
              )}
            </div>
          </div>

          {/* Birim & Tema */}
          <div className="border-t border-line pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Görünüm ve Birimler</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-xs text-muted">Ağırlık ve Mesafe Birimi</p>
                <div className="flex gap-2">
                  <Btn tone={birim === "kg" ? "primary" : "quiet"} onClick={() => setBirim("kg")}>
                    kg / km
                  </Btn>
                  <Btn tone={birim === "lb" ? "primary" : "quiet"} onClick={() => setBirim("lb")}>
                    lb / mil
                  </Btn>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs text-muted">Arayüz Teması</p>
                <div className="flex gap-2">
                  <Btn tone={tema === "acik" ? "primary" : "quiet"} onClick={() => setTema("acik")}>
                    Açık
                  </Btn>
                  <Btn tone={tema === "koyu" ? "primary" : "quiet"} onClick={() => setTema("koyu")}>
                    Koyu
                  </Btn>
                </div>
              </div>
            </div>
          </div>

          {/* Antrenman & GPS */}
          <div className="border-t border-line pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
              Antrenman ve Donanım Tercihleri
            </p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded-xl border border-line bg-cream p-3">
                <div>
                  <p className="text-xs font-medium text-ink">Canlı Rota Çizgisi</p>
                  <p className="text-[11px] text-muted">Haritada kat ettiğin yolu anlık göster</p>
                </div>
                <Btn
                  tone={settings.livePolyline ? "primary" : "quiet"}
                  onClick={() => updateSetting("livePolyline", !settings.livePolyline)}
                >
                  {settings.livePolyline ? "Açık" : "Kapalı"}
                </Btn>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-line bg-cream p-3">
                <div>
                  <p className="text-xs font-medium text-ink">Sesli Geri Bildirim</p>
                  <p className="text-[11px] text-muted">Kilometre ve antrenman sesli anonsları</p>
                </div>
                <Btn
                  tone={settings.voiceFeedback ? "primary" : "quiet"}
                  onClick={() => updateSetting("voiceFeedback", !settings.voiceFeedback)}
                >
                  {settings.voiceFeedback ? "Açık" : "Kapalı"}
                </Btn>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-line bg-cream p-3">
                <div>
                  <p className="text-xs font-medium text-ink">Titreşim (Haptic)</p>
                  <p className="text-[11px] text-muted">Başlatma, durdurma ve kilometre titreşimleri</p>
                </div>
                <Btn
                  tone={settings.haptics ? "primary" : "quiet"}
                  onClick={() => updateSetting("haptics", !settings.haptics)}
                >
                  {settings.haptics ? "Açık" : "Kapalı"}
                </Btn>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-line bg-cream p-3">
                <div>
                  <p className="text-xs font-medium text-ink">Çevrimdışı Kayıt</p>
                  <p className="text-[11px] text-muted">İnternet koptuğunda rotayı cihazda sakla</p>
                </div>
                <Btn
                  tone={settings.offlineSync ? "primary" : "quiet"}
                  onClick={() => updateSetting("offlineSync", !settings.offlineSync)}
                >
                  {settings.offlineSync ? "Açık" : "Kapalı"}
                </Btn>
              </div>
            </div>
          </div>

          {/* Veri Sıfırlama */}
          <div className="border-t border-line pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Veri ve Sıfırlama</p>
            <div className="flex flex-wrap gap-2">
              <Btn tone="quiet" onClick={sor("Tüm antrenman geçmişi silinsin mi?", temizleAntrenman)}>
                Antrenmanları Temizle
              </Btn>
              <Btn tone="quiet" onClick={sor("Koç sohbet geçmişi silinsin mi?", temizleSohbet)}>
                Sohbeti Temizle
              </Btn>
              <Btn tone="quiet" onClick={sor("Kayıtlı tüm kilo geçmişi silinsin mi?", temizleKilo)}>
                Kilo Geçmişini Sil
              </Btn>
              <Btn
                tone={sifirlaOnay ? "primary" : "quiet"}
                onClick={handleSifirla}
              >
                {sifirlaOnay ? "Onaylamak için tekrar tıkla" : "Cihazdaki Tüm Veriyi Sıfırla"}
              </Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}