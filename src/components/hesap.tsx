import { useState } from "react";
import { useOturum } from "@/lib/auth";
import { cikisYap } from "@/lib/sync";
import {
  User,
  LogOut,
  CloudCheck,
  CloudOff,
  RefreshCw,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function HesapPanel() {
  const email = useOturum((s) => s.email);
  const senkron = useOturum((s) => s.senkron);
  const [bekle, setBekle] = useState(false);
  const [not, setNot] = useState("");

  const cik = async () => {
    if (bekle) return;
    setBekle(true);
    setNot("");
    try {
      const sonuc = await cikisYap();
      if (sonuc === "kaydedilemedi") {
        const devam = window.confirm(
          "Son değişiklikler hesabına kaydedilemedi. Yine de çıkarsan bu değişiklikler kaybolur. Çıkılsın mı?"
        );
        if (devam) await cikisYap(true);
        else setNot("Çıkış iptal edildi. İnternetini kontrol edip tekrar dene.");
      }
    } finally {
      setBekle(false);
    }
  };

  const durum =
    senkron === "hata"
      ? "Kaydedilemedi, internetini kontrol et"
      : senkron === "kaydedildi"
        ? "Hesabında kayıtlı"
        : "Kontrol ediliyor";

  return (
    <div className="rounded-xl border border-line bg-surface p-5 font-sans">
      <div className="flex items-center gap-2 border-b border-line pb-3 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pine/10 text-pine">
          <User className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-serif text-lg font-bold text-ink leading-none">
            Hesap Bilgileri
          </h2>
          <span className="text-[12px] text-muted mt-1 block">
            Oturum ve senkronizasyon durumu
          </span>
        </div>
      </div>

      <dl className="divide-y divide-line">
        <div className="flex items-center justify-between py-3 text-[13px]">
          <dt className="text-muted">E-posta</dt>
          <dd className="font-medium text-ink">{email ?? "—"}</dd>
        </div>
        <div className="flex items-center justify-between py-3 text-[13px]">
          <dt className="text-muted">Bulut Senkronizasyonu</dt>
          <dd className="flex items-center gap-1.5 font-medium">
            {senkron === "kaydedildi" ? (
              <>
                <CloudCheck className="w-4 h-4 text-pine" />
                <span className="text-pine">{durum}</span>
              </>
            ) : senkron === "hata" ? (
              <>
                <CloudOff className="w-4 h-4 text-clay" />
                <span className="text-clay">{durum}</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-muted animate-spin" />
                <span className="text-muted">{durum}</span>
              </>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-3 pt-2 border-t border-line">
        <button
          type="button"
          onClick={cik}
          disabled={bekle}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-line bg-paper px-4 py-2.5 text-[13px] font-medium text-ink hover:border-muted/40 transition-colors disabled:opacity-50"
        >
          {bekle ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-muted" />
              <span>Çıkış yapılıyor...</span>
            </>
          ) : (
            <>
              <LogOut className="w-4 h-4 text-muted" />
              <span>Çıkış yap</span>
            </>
          )}
        </button>

        {not && (
          <div className="flex items-center gap-1.5 text-[13px] text-clay">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{not}</span>
          </div>
        )}
      </div>
    </div>
  );
}