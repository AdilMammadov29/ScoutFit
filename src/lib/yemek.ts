import { Capacitor, CapacitorHttp } from "@capacitor/core";

export type BesinOgesi = {
  ad: string;
  porsiyon?: string;
  kalori: number;
  kcal: number;
  protein: number;
  karb: number;
  yag: number;
};

export type YemekAnalizSonuc =
  | { ok: true; ogeler: BesinOgesi[]; toplamKalori: number }
  | { ok: false; hata: string };

export type YemekGirdi = string | { data: { metin: string } };

export function bugunAnahtar(): string {
  const simdi = new Date();
  const yil = simdi.getFullYear();
  const ay = String(simdi.getMonth() + 1).padStart(2, "0");
  const gun = String(simdi.getDate()).padStart(2, "0");
  return `${yil}-${ay}-${gun}`;
}

const SISTEM_ISTEMI = `Sen ScoutFit uygulamasının profesyonel beslenme ve kalori veri tabanısın.
Kullanıcının girdiği öğünleri, besinleri ve gramajları gerçekçi besin değerleriyle analiz et.

KESİN BESİN DEĞERİ KURALLARI:
1. Paketli Atıştırmalıklar (Bisküvi, Tutku, Negro, Çikolata, Cips vb.):
   - 100 gramları ortalama 480 - 530 kcal arasındadır.
   - Örnek: 100g Tutku / bisküvi yaklaşık 500-510 kcal, 25-28g yağ, 60-65g karb, 5g protein içerir. Asla 100 gramına 150 kcal gibi düşük değer verme!
2. Yemekler ve Temel Gıdalar:
   - Pişmiş pirinç/bulgur: 100g ~120-130 kcal
   - Pişmiş tavuk göğsü: 100g ~160 kcal (30g protein)
   - Çiğ yulaf: 100g ~370 kcal
   - 1 adet yumurta: ~70-75 kcal
3. Makro Tutarlılığı: Kalori = (Protein × 4) + (Karb × 4) + (Yağ × 9) kuralına uygun olmalıdır.

Yanıtını YALNIZCA geçerli bir JSON objesi formatında döndür. Açıklama veya markdown (\`\`\`json) yazma.

Format:
{
  "ogeler": [
    {
      "ad": "Besin Adı",
      "porsiyon": "Miktar (örn: 100g)",
      "kalori": 510,
      "kcal": 510,
      "protein": 5,
      "karb": 65,
      "yag": 26
    }
  ],
  "toplamKalori": 510
}`;

export async function yemekHesapla(girdiParam: YemekGirdi): Promise<YemekAnalizSonuc> {
  const metin =
    typeof girdiParam === "string"
      ? girdiParam
      : (girdiParam as { data?: { metin?: string } })?.data?.metin ?? "";

  const girdi = metin.trim();
  if (!girdi) return { ok: false, hata: "Metin boş olamaz." };

  const rawKey =
    import.meta.env.VITE_GROQ_API_KEY ||
    "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";

  const apiKey = String(rawKey).trim();

  if (!apiKey) {
    return {
      ok: true,
      ogeler: [
        {
          ad: "Hata: Groq API anahtarı bulunamadı.",
          kalori: 0,
          kcal: 0,
          protein: 0,
          karb: 0,
          yag: 0,
        },
      ],
      toplamKalori: 0,
    };
  }

  const payload = {
    model: "openai/gpt-oss-120b",
    temperature: 0.1,
    max_tokens: 1200,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SISTEM_ISTEMI },
      { role: "user", content: `Öğünü analiz et: ${girdi}` },
    ],
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  try {
    let body: any;

    if (Capacitor.isNativePlatform()) {
      const res = await CapacitorHttp.post({
        url: "https://api.groq.com/openai/v1/chat/completions",
        headers,
        data: payload,
        connectTimeout: 30000,
        readTimeout: 30000,
      });

      if (res.status !== 200) {
        const errDetail =
          typeof res.data === "string" ? res.data : JSON.stringify(res.data);
        return {
          ok: true,
          ogeler: [
            {
              ad: `API Hatası (${res.status}): ${errDetail}`,
              kalori: 0,
              kcal: 0,
              protein: 0,
              karb: 0,
              yag: 0,
            },
          ],
          toplamKalori: 0,
        };
      }
      body = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    } else {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errBody = await res.text();
        return {
          ok: true,
          ogeler: [
            {
              ad: `Web API Hatası (${res.status}): ${errBody}`,
              kalori: 0,
              kcal: 0,
              protein: 0,
              karb: 0,
              yag: 0,
            },
          ],
          toplamKalori: 0,
        };
      }
      body = await res.json();
    }

    let rawContent = body.choices?.[0]?.message?.content?.trim() ?? "";

    if (!rawContent) {
      return {
        ok: true,
        ogeler: [
          {
            ad: "Hata: Groq modelinden boş içerik döndü.",
            kalori: 0,
            kcal: 0,
            protein: 0,
            karb: 0,
            yag: 0,
          },
        ],
        toplamKalori: 0,
      };
    }

    if (rawContent.startsWith("```")) {
      rawContent = rawContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      return {
        ok: true,
        ogeler: [
          {
            ad: `JSON Ayrıştırma Hatası: ${rawContent.slice(0, 120)}`,
            kalori: 0,
            kcal: 0,
            protein: 0,
            karb: 0,
            yag: 0,
          },
        ],
        toplamKalori: 0,
      };
    }

    const hamOgeler = Array.isArray(parsed?.ogeler) ? parsed.ogeler : [];
    const ogeler: BesinOgesi[] = hamOgeler.map((o: any) => {
      const cal = Math.round(Number(o.kalori ?? o.kcal) || 0);
      return {
        ad: String(o.ad || "Bilinmeyen Besin"),
        porsiyon: o.porsiyon ? String(o.porsiyon) : undefined,
        kalori: cal,
        kcal: cal,
        protein: Math.round(Number(o.protein) || 0),
        karb: Math.round(Number(o.karb) || 0),
        yag: Math.round(Number(o.yag) || 0),
      };
    });

    const hesaplananToplam = ogeler.reduce((acc, cur) => acc + cur.kalori, 0);
    const toplamKalori =
      typeof parsed?.toplamKalori === "number" && !isNaN(parsed.toplamKalori)
        ? Math.round(parsed.toplamKalori)
        : hesaplananToplam;

    return { ok: true, ogeler, toplamKalori };
  } catch (err: any) {
    return {
      ok: true,
      ogeler: [
        {
          ad: `Bağlantı Hatası: ${err?.message || String(err)}`,
          kalori: 0,
          kcal: 0,
          protein: 0,
          karb: 0,
          yag: 0,
        },
      ],
      toplamKalori: 0,
    };
  }
}

export const yemekAnalizEt = yemekHesapla;