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

    // 1. Dizi formatını dene: [...]
    const basDizi = temiz.indexOf("[");
    const sonDizi = temiz.lastIndexOf("]");
    if (basDizi >= 0 && sonDizi > basDizi) {
      const parsed = JSON.parse(temiz.slice(basDizi, sonDizi + 1));
      if (Array.isArray(parsed)) {
        const ogeler = parseOgeler(parsed);
        if (ogeler.length) return ogeler;
      }
    }

    // 2. Tek nesne formatını dene: {...}
    const basNesne = temiz.indexOf("{");
    const sonNesne = temiz.lastIndexOf("}");
    if (basNesne >= 0 && sonNesne > basNesne) {
      const parsed = JSON.parse(temiz.slice(basNesne, sonNesne + 1));
      const ogeler = parseOgeler(Array.isArray(parsed) ? parsed : [parsed]);
      if (ogeler.length) return ogeler;
    }

    return null;
  } catch (err) {
    console.error("Ayıklama Hatası:", err, text);
    return null;
  }
}

function parseOgeler(liste: any[]): YemekOge[] {
  const sonuc: YemekOge[] = [];
  for (const oge of liste.slice(0, 10)) {
    const ad = String(oge?.ad ?? oge?.isim ?? "").trim().slice(0, 80);
    const kcal = Math.round(Number(oge?.kcal ?? oge?.kalori));
    // 0 kcal (su, sade americano vb.) geçerli bir kaloridir
    if (!ad || !Number.isFinite(kcal) || kcal < 0 || kcal > 4000) continue;
    sonuc.push({ ad, kcal });
  }
  return sonuc;
}

const ISTEM = `Sen bir beslenme ve kalori hesaplama uzmanısın. Kullanıcı yediği veya içtiği besinleri yazar (örneğin: "250 ml ice americano" veya "150g tavuk ve pilav").
Görevin bu besinlerin tahmini kalorisini hesaplamaktır. Sade filtre kahve, americano, maden suyu gibi içeceklerin kalorisi 0 ile 10 kcal arasında olabilir, sıfır kalori olması geçerlidir.

Yanıtını SADECE ve KESİNLİKLE aşağıdaki geçerli JSON dizi formatında ver, başka hiçbir açıklama veya selamlama yazma:
[{"ad": "Ice Americano (250 ml)", "kcal": 5}]`;

export async function yemekHesapla({ data }: { data: { metin: string } }) {
  const metin = data.metin.trim();
  if (!metin) {
    return { ok: false as const, hata: "bos" };
  }

  const apiKey =
    import.meta.env.VITE_GROQ_API_KEY ||
    (typeof process !== "undefined" ? process.env?.VITE_GROQ_API_KEY : "") ||
    "";

  if (!apiKey) {
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