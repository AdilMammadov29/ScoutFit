import { useState } from "react";
import { Btn, Panel, Row } from "@/components/ui";
import { useOturum } from "@/lib/auth";
import { cikisYap } from "@/lib/sync";

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
          "Son değişiklikler hesabına kaydedilemedi. Yine de çıkarsan bu değişiklikler kaybolur. Çıkılsın mı?",
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
    <Panel title="Hesap">
      <Row label="E-posta" value={email ?? "-"} />
      <Row label="Veriler" value={durum} />
      <div className="flex items-center gap-4 py-5">
        <Btn tone="quiet" onClick={cik} disabled={bekle}>
          {bekle ? "Çıkış yapılıyor..." : "Çıkış yap"}
        </Btn>
        {not ? <p className="text-sm text-muted">{not}</p> : null}
      </div>
    </Panel>
  );
}