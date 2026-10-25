import { Capacitor, CapacitorHttp } from "@capacitor/core";

export interface YemekAnalizSonuc {
  ad: string;
  kalori: number;
  protein: number;
  karbonhidrat: number;
  yag: number;
}

export async function yemekAnalizEt(metin: string): Promise<YemekAnalizSonuc> {
  const s = String(metin ?? "").trim();
  if (!s) {
    return { ad: "Bilinmeyen Öğün", kalori: 0, protein: 0, karbonhidrat: 0, yag: 0 };
  }

  const apiKey = "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";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const prompt = `Besin: "${s}"
Porsiyona göre toplam kalori ve makroları hesapla.
SADECE JSON üret:
{"ad": "${s}", "kalori": 330, "protein": 62, "karbonhidrat": 0, "yag": 7}`;

  const payload = {
    model: "openai/gpt-oss-120b",
    temperature: 0.1,
    max_tokens: 400,
    messages: [
      { role: "system", content: "Sen bir besin analiz motorusun. Yalnızca saf JSON çıktısı üretirsin." },
      { role: "user", content: prompt },
    ],
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey.trim()}`,
  };

  try {
    let rawContent = "";

    if (Capacitor.isNativePlatform()) {
      const res = await CapacitorHttp.post({
        url,
        headers,
        data: payload,
        connectTimeout: 20000,
        readTimeout: 20000,
      });

      if (res.status === 200) {
        const d = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
        rawContent = d?.choices?.[0]?.message?.content || "";
      }
    } else {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const d = await res.json();
        rawContent = d?.choices?.[0]?.message?.content || "";
      }
    }

    if (rawContent) {
      const clean = rawContent.replace(/```json/gi, "").replace(/```/g, "").trim();
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const p = JSON.parse(match[0]);
        return {
          ad: String(p.ad || s),
          kalori: Math.max(0, Math.round(Number(p.kalori ?? p.calories ?? 0))),
          protein: Math.max(0, Math.round(Number(p.protein ?? 0))),
          karbonhidrat: Math.max(0, Math.round(Number(p.karbonhidrat ?? p.karb ?? p.carbs ?? 0))),
          yag: Math.max(0, Math.round(Number(p.yag ?? p.fat ?? 0))),
        };
      }
    }
  } catch (err) {
    console.error("Yemek analiz hatası:", err);
  }

  // Model cevabı parse edilemezse 0 basarak durumun görülmesini sağlar
  return {
    ad: s,
    kalori: 0,
    protein: 0,
    karbonhidrat: 0,
    yag: 0,
  };
}