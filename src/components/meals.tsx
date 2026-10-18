import { useState } from "react";
import { useFit } from "@/lib/store";
import { profildenHesap } from "@/lib/engine";
import { PageTitle } from "@/components/ui";
import { kocSor } from "@/lib/coach";    // ← BURAYA koy

// --- GELİŞTİRİLMİŞ YAPAY ZEKA KALORİ MOTORU ---
async function aiKaloriHesapla(metin: string): Promise<{ isim: string; kalori: number }> {
  try {
    const prompt = `Aşağıdaki yemeğin yaklaşık kalorisini hesapla.
Yemek: "${metin}"

Kurallar:
- Sadece tek bir tam sayı yaz (örnek: 370)
- Hiçbir açıklama, birim, kelime veya noktalama ekleme
- Sadece sayı`;

    const sonuc = await kocSor({
      data: {
        soru: prompt,
        baglam: "Sen sadece sayı döndüren bir kalori hesaplama motorusun. Asla kelime kullanma. Sadece tam sayı yaz."
      }
    });

    if (sonuc.ok === true && typeof sonuc.metin === "string") {
      const temiz = sonuc.metin.replace(/[^\d]/g, "");
      const kaloriDegeri = parseInt(temiz, 10);

      if (!isNaN(kaloriDegeri) && kaloriDegeri > 10 && kaloriDegeri < 5000) {
        return {
          isim: metin.charAt(0).toUpperCase() + metin.slice(1),
          kalori: kaloriDegeri
        };
      }
    }
  } catch (error) {
    console.error("AI Kalori hatası:", error);
  }

  return {
    isim: metin.charAt(0).toUpperCase() + metin.slice(1) + " (AI cevap vermedi)",
    kalori: 0
  };
}