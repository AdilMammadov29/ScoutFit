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

const SISTEM_ISTEMI = `Sen ScoutFit uygulamasının beslenme ve kalori uzmanısın.
Kullanıcının girdiği yemek/öğün açıklamasını analiz et.
Yanıtını YALNIZCA geçerli bir JSON objesi formatında döndür. Açıklama, markdown etiketi (\`\`\`json) veya selamlama yazma.
Beklenen JSON formatı:
{
  "ogeler": [
    {
      "ad": "Yemek/Besin Adı",
      "porsiyon": "Miktar (örn: 200g, 1 tabak)",
      "kalori": 250,
      "protein": 30,
      "karb": 20,
      "yag": 5
    }
  ],
  "toplamKalori": 250
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
        temperature: 0.2,
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