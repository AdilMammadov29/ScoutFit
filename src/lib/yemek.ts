export type YemekOge = { ad: string; kcal: number };

export function bugunAnahtar(tarih = new Date()) {
  const y = tarih.getFullYear();
  const a = String(tarih.getMonth() + 1).padStart(2, "0");
  const g = String(tarih.getDate()).padStart(2, "0");
  return `${y}-${a}-${g}`;
}

function ayikla(text: string): YemekOge[] | null {
  try {
    const temiz = text.replace(/```json|```/gi, "").trim();
    const bas = temiz.indexOf("[");
    const son = temiz.lastIndexOf("]");
    
    if (bas < 0 || son <= bas) {
      console.error("Ayıklama Hatası: Köşeli parantez bulunamadı.", text);
      return null;
    }
    
    const parsed = JSON.parse(temiz.slice(bas, son + 1));
    if (!Array.isArray(parsed)) return null;
    
    const ogeler: YemekOge[] = [];
    for (const oge of parsed.slice(0, 6)) {
      const ad = String(oge?.ad ?? "").trim().slice(0, 80);
      const kcal = Math.round(Number(oge?.kcal));
      if (!ad || !Number.isFinite(kcal) || kcal < 1 || kcal > 2500) continue;
      ogeler.push({ ad, kcal });
    }
    return ogeler.length ? ogeler : null;
  } catch (err) {
    console.error("Ayıklama Çöktü:", err, text);
    return null;
  }
}

export async function yemekHesapla({ data }: { data: { metin?: string } }) {
  const metin = String(data?.metin ?? "").trim().slice(0, 300);
  if (!metin) return { ok: false as const, hata: "bos" };

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.error("HATA: VITE_GROQ_API_KEY bulunamadı!");
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
        model: "llama3-8b-8192", // En stabil Groq modeli
        temperature: 0.1,
        max_tokens: 500,
        messages: [
          {
            role: "system",
            content: `Sen bir kalori hesaplama asistanısın. Kullanıcının yediğini analiz et.
Cevabın SADECE şu formattaki bir JSON dizisi olmalıdır, başka hiçbir metin veya açıklama yazma:
[
  { "ad": "Yemek adı", "kcal": 150 }
]

Kurallar:
- Probis: 100 gram yaklaşık 110 kcal.
- Yumurta: yaklaşık 75 kcal. 
- Porsiyon veya gramaj yoksa standart ölçü kullan.
- En fazla 6 farklı yemek ekle.
- Sadece JSON listesi (array) döndür, nesne (object) değil.`
          },
          { role: "user", content: metin },
        ]
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Hatası (${res.status}):`, errorText);
      return { ok: false as const, hata: `http-${res.status}` };
    }

    const body = await res.json();
    const textContent = body.choices?.[0]?.message?.content ?? "";
    console.log("Groq'dan gelen ham cevap:", textContent);
    
    const ogeler = ayikla(textContent);
    
    if (!ogeler) {
       console.error("Ayıklanamayan Yanıt:", textContent);
       return { ok: false as const, hata: "ayiklanamadi" };
    }
    
    return { ok: true as const, ogeler };
  } catch (err) {
    console.error("Ağ Hatası:", err);
    return { ok: false as const, hata: "ag" };
  }
}