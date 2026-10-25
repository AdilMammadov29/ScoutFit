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

  const sistemPrompt = `Sen profesyonel bir diyetisyen ve besin analiz motorusun.
Görevin: Kullanıcının girdiği besini ve gramajını analiz edip net kalori ve makroları (protein, karbonhidrat, yağ) hesaplamak.
Eğer gramaj verilmemişse standart 1 porsiyon üzerinden hesapla.
ÇIKTI KURALI:
Sadece ve sadece geçerli bir JSON objesi döndür. Kesinlikle markdown (\`\`\`json), selamlama veya açıklama yazma.
Alanlar: "ad" (string), "kalori" (tam sayı kcal), "protein" (tam sayı gram), "karbonhidrat" (tam sayı gram), "yag" (tam sayı gram).`;

  const payload = {
    model: "openai/gpt-oss-120b",
    temperature: 0.1,
    max_tokens: 300,
    messages: [
      { role: "system", content: sistemPrompt },
      { role: "user", content: `Aşağıdaki besinin besin değerlerini hesapla:\n${s}` },
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

  return {
    ad: s,
    kalori: 0,
    protein: 0,
    karbonhidrat: 0,
    yag: 0,
  };
}