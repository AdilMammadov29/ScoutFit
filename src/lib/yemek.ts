import { sendAIChatRequest, AI_CONFIG } from "@/services/ai/client";

export interface YemekAnalizSonuc {
  ad: string;
  kalori: number;
  protein: number;
  karb?: number;
  karbonhidrat?: number;
  yag: number;
}

export async function yemekAnalizEt(girdi: string): Promise<YemekAnalizSonuc> {
  const sistemPrompt = `Sen bir besin analizi motorusun. Kullanıcının girdiği yiyecek ve gramaja göre kalori ve makroları hesapla. 
Sadece şu JSON formatında yanıt ver, başka hiçbir metin veya markdown bloğu ekleme:
{"ad": "Yemek Adı", "kalori": 100, "protein": 5, "karbonhidrat": 10, "karb": 10, "yag": 2}`;

  const raw = await sendAIChatRequest(
    [
      { role: "system", content: sistemPrompt },
      { role: "user", content: `Hesapla: ${girdi}` },
    ],
    {
      model: AI_CONFIG.models.food,
      temperature: 0.1,
      maxTokens: 300,
    }
  );

  try {
    const temizJson = raw.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(temizJson);
    return {
      ad: parsed.ad || "Bilinmeyen Yemek",
      kalori: Number(parsed.kalori) || 0,
      protein: Number(parsed.protein) || 0,
      karbonhidrat: Number(parsed.karbonhidrat ?? parsed.karb) || 0,
      karb: Number(parsed.karb ?? parsed.karbonhidrat) || 0,
      yag: Number(parsed.yag) || 0,
    };
  } catch (err) {
    console.error("Yemek JSON parse hatası:", raw);
    throw new Error("Besin verisi çözümlenemedi.");
  }
}

export const analizEtYemek = yemekAnalizEt;