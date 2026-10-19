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
      if (!ad || !Number.isFinite(kcal) || kcal < 0 || kcal > 2500) continue;
      ogeler.push({ ad, kcal });
    }
    return ogeler.length ? ogeler : null;
  } catch (err) {
    console.error("Ayıklama Çöktü:", err, text);
    return null;
  }
}

const ISTEM = `Sen bir kalori hesaplama asistanısın. Kullanıcı yediği ya da içtiği şeyi yazar. Yemek, içecek, kahve, çay, atıştırmalık ve takviye hepsi geçerlidir.
Cevabın SADECE şu biçimde bir JSON dizisi olmalı, başka hiçbir metin yazma:
[{ "ad": "Kısa Türkçe ad", "kcal": 150 }]

Kurallar:
- Yazılan her yiyecek ve içecek için bir öğe ekle. Anlayabildiğin her şeyi tahmin et, yaklaşık değer yeterli.
- Yazı Türkçe, İngilizce ya da karışık olabilir (örn. ice americano, latte, probis, salam).
- Miktar varsa ona göre hesapla. Miktar yoksa standart bir porsiyon varsay.
- Şekersiz kahve ve çay gibi çok düşük kalorili içeceklere 2 ile 5 kcal arasında bir değer yaz. Sütlü ya da şekerliyse buna göre hesapla.
- Örnek değerler: probis 100 g yaklaşık 110 kcal, yumurta yaklaşık 75 kcal.
- En fazla 6 öğe ekle.
- Yazılanın içinde hiçbir yiyecek ya da içecek yoksa (örn. sadece bir selamlama) boş dizi [] döndür.`;

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
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        temperature: 0.1,
        max_tokens: 1200,
        messages: [
          { role: "system", content: ISTEM },
          { role: "user", content: metin },
        ],
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