export type YemekOge = { ad: string; kcal: number };

export function bugunAnahtar(tarih = new Date()) {
  const y = tarih.getFullYear();
  const a = String(tarih.getMonth() + 1).padStart(2, "0");
  const g = String(tarih.getDate()).padStart(2, "0");
  return `${y}-${a}-${g}`;
}

function ayikla(text: string): YemekOge[] | null {
  const temiz = text.replace(/```json|```/gi, "").trim();
  const bas = temiz.indexOf("{");
  const son = temiz.lastIndexOf("}");
  if (bas < 0 || son <= bas) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(temiz.slice(bas, son + 1));
  } catch {
    return null;
  }
  const ham = (parsed as { ogeler?: unknown }).ogeler;
  if (!Array.isArray(ham)) return null;
  const ogeler: YemekOge[] = [];
  for (const oge of ham.slice(0, 6)) {
    const kayit = oge as { ad?: unknown; kcal?: unknown };
    const ad = String(kayit?.ad ?? "").trim().slice(0, 80);
    const kcal = Math.round(Number(kayit?.kcal));
    if (!ad || !Number.isFinite(kcal) || kcal < 1 || kcal > 2500) continue;
    ogeler.push({ ad, kcal });
  }
  return ogeler.length ? ogeler : null;
}

export async function yemekHesapla({ data }: { data: { metin?: string } }) {
  const metin = String(data?.metin ?? "").trim().slice(0, 300);
  if (!metin) return { ok: false as const, hata: "bos" };

  // Burası Vercel'den senin kendi Groq anahtarını çeker
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.error("Groq API Anahtarı bulunamadı!");
    return { ok: false as const, hata: "yok" };
  }

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.1,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `Kullanıcının yediği şeyi gerçekçi kaloriye çevir.
Sadece JSON yaz, başka cümle yok:
{"ogeler":[{"ad":"kısa Türkçe ad","kcal":123}]}
Kurallar:
- Gram, adet ve marka varsa ona göre hesapla.
- Probis bir proteinli sütlü tatlıdır: 100 gram yaklaşık 110 kcal. 75 gram yaklaşık 80 kcal.
- Yumurta tanesi yaklaşık 75 kcal. Pilav 100 gram yaklaşık 130 kcal. Tavuk göğsü 100 gram yaklaşık 165 kcal.
- Birden fazla yiyecek varsa her birini ayrı öğe yap. Toplamı tek satıra yığma.
- kcal tam sayı, 1 ile 2500 arası. En fazla 6 öğe.
- Markdown kullanma. Sadece geçerli JSON döndür.`,
          },
          { role: "user", content: metin },
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!res.ok) {
      console.error("API Hatası:", await res.text());
      return { ok: false as const, hata: `http-${res.status}` };
    }

    const body = await res.json();
    const textContent = body.choices?.[0]?.message?.content ?? "";
    const ogeler = ayikla(textContent);
    
    if (!ogeler) return { ok: false as const, hata: "ayiklanamadi" };
    return { ok: true as const, ogeler };
  } catch (err) {
    console.error("Ağ hatası:", err);
    return { ok: false as const, hata: "ag" };
  }
}