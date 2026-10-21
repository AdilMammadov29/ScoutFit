export type BesinOgesi = {
  ad: string;
  porsiyon?: string;
  kalori: number;
  protein: number;
  karb: number;
  yag: number;
};

export type YemekAnalizSonuc =
  | { ok: true; ogeler: BesinOgesi[]; toplamKalori: number }
  | { ok: false; hata: string };

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
      "protein": 5,
      "karb": 65,
      "yag": 26
    }
  ],
  "toplamKalori": 510
}`;

export async function yemekAnalizEt(metin: string): Promise<YemekAnalizSonuc> {
  const girdi = metin.trim();
  if (!girdi) return { ok: false, hata: "Metin boş olamaz." };

  const apiKey =
    import.meta.env.VITE_GROQ_API_KEY ||
    (typeof process !== "undefined" ? process.env?.VITE_GROQ_API_KEY : "") ||
    "";

  if (!apiKey) {
    console.error("Groq API anahtarı bulunamadı.");
    return { ok: false, hata: "api_key_eksik" };
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: AbortSignal.timeout(25000),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${String(apiKey).trim()}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.1, // Tutarlılık için sıcaklığı 0.1'e çektik
        max_tokens: 1200,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SISTEM_ISTEMI },
          { role: "user", content: `Öğünü analiz et: ${girdi}` },
        ],
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("API Hatası (" + res.status + "):", errBody);
      return { ok: false, hata: `http-${res.status}` };
    }

    const body = await res.json();
    const rawContent = body.choices?.[0]?.message?.content?.trim() ?? "";
    const parsed = JSON.parse(rawContent);

    const ogeler: BesinOgesi[] = Array.isArray(parsed.ogeler) ? parsed.ogeler : [];
    const toplamKalori =
      typeof parsed.toplamKalori === "number"
        ? parsed.toplamKalori
        : ogeler.reduce((acc, cur) => acc + (Number(cur.kalori) || 0), 0);

    return { ok: true, ogeler, toplamKalori };
  } catch (err) {
    console.error("Yemek analiz hatası:", err);
    return { ok: false, hata: "analiz_hatasi" };
  }
}