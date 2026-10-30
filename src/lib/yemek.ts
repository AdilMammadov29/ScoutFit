import { sendAIChatRequest, AI_CONFIG } from "@/services/ai/client";

export interface YemekAnalizSonuc {
  ad: string;
  kalori: number;
  protein: number;
  karb?: number;
  karbonhidrat?: number;
  yag: number;
}

/**
 * Girdiden gramaj bilgisini ayıklar (Örn: "75 gram probis" -> { gramaj: 75, temizMetin: "probis" })
 */
function gramajAyikla(girdi: string): { gramaj: number; aramaMetni: string } {
  let gramaj = 100; // Varsayılan 100g
  let aramaMetni = girdi.trim();

  const regex = /(\d+(?:[.,]\d+)?)\s*(?:gr|gram|g)\b/i;
  const match = girdi.match(regex);

  if (match) {
    gramaj = parseFloat(match[1].replace(",", "."));
    aramaMetni = girdi.replace(regex, "").trim();
  }

  // Başta/sonda kalan "1 paket", "1 adet" gibi kelimeleri temizle
  aramaMetni = aramaMetni
    .replace(/^\d+\s*(?:tane|adet|porsiyon|paket)\s*/i, "")
    .trim();

  return { gramaj: gramaj > 0 ? gramaj : 100, aramaMetni: aramaMetni || girdi };
}

/**
 * Open Food Facts Türkiye & Global Veritabanında Ürün Arama
 */
async function openFoodFactsAra(terim: string, gramaj: number): Promise<YemekAnalizSonuc | null> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      terim
    )}&search_simple=1&action=process&json=1&page_size=3`;

    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.products || data.products.length === 0) return null;

    const product =
      data.products.find(
        (p: any) =>
          p.nutriments && (p.nutriments["energy-kcal_100g"] || p.nutriments["energy-kcal"])
      ) || data.products[0];

    const n = product.nutriments;
    if (!n) return null;

    const katsayi = gramaj / 100;
    const kalori100 = Number(
      n["energy-kcal_100g"] ??
        n["energy-kcal"] ??
        (n["energy_100g"] ? n["energy_100g"] / 4.184 : 0)
    );
    const protein100 = Number(n["proteins_100g"] ?? n["proteins"] ?? 0);
    const karb100 = Number(n["carbohydrates_100g"] ?? n["carbohydrates"] ?? 0);
    const yag100 = Number(n["fat_100g"] ?? n["fat"] ?? 0);

    if (kalori100 === 0 && protein100 === 0 && karb100 === 0) {
      return null;
    }

    const urunAdi = product.product_name_tr || product.product_name || terim;

    return {
      ad: `${Math.round(gramaj)}g ${urunAdi}`,
      kalori: Math.round(kalori100 * katsayi),
      protein: Math.round(protein100 * katsayi),
      karbonhidrat: Math.round(karb100 * katsayi),
      karb: Math.round(karb100 * katsayi),
      yag: Math.round(yag100 * katsayi),
    };
  } catch (err) {
    console.warn("OpenFoodFacts sorgu hatası, Groq AI devreye girecek:", err);
    return null;
  }
}

/**
 * Groq AI ile Serbest Yemek / Porsiyon Analizi
 */
async function aiYemekAnalizEt(girdi: string): Promise<YemekAnalizSonuc> {
  const sistemPrompt = `Sen uzman bir beslenme uzmanısın. Kullanıcının yazdığı yiyeceğin (ev yemeği, restoran yemeği, Türk lezzetleri veya paketli ürün) kalori ve makrolarını hesapla.

ÖNEMLİ PORSIYON KURALLARI:
1. Eğer gramaj açıkça belirtilmemişse ve "1 porsiyon" denmişse:
   - Yan lezzetler/atıştırmalıklar (örneğin patates kızartması, meze vb.) için standart ev porsiyonunu (~100-110 gram, yaklaşık 280-310 kcal) baz al; dev boy fast-food restoran porsiyonlarını baz alma.
   - Ana yemekler için ortalama 1 tabak standart porsiyonu (200-250g) referans al.
2. Eğer ürün tam olarak bulunamazsa türüne en yakın ortalama değerlerle hesapla.
3. Asla boş dönme, açıklama veya selamlama yazma.
4. YALNIZCA geçerli bir JSON nesnesi döndür:
{"ad": "Yiyecek İsmi", "kalori": 280, "protein": 4, "karbonhidrat": 36, "yag": 14}`;

  const raw = await sendAIChatRequest(
    [
      { role: "system", content: sistemPrompt },
      { role: "user", content: `Analiz et: ${girdi}` },
    ],
    {
      model: AI_CONFIG.models.food || AI_CONFIG.models.coach,
      temperature: 0.1,
      maxTokens: 300,
    }
  );

  if (!raw || typeof raw !== "string" || raw.trim().length === 0) {
    throw new Error("Yapay zekadan boş yanıt geldi.");
  }

  const temiz = raw.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
  const match = temiz.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Geçerli bir JSON bulunamadı: " + raw);
  }

  const parsed = JSON.parse(match[0]);
  const karbDeger = Number(parsed.karbonhidrat ?? parsed.karb) || 0;

  return {
    ad: String(parsed.ad || girdi).trim(),
    kalori: Math.round(Number(parsed.kalori) || 0),
    protein: Math.round(Number(parsed.protein) || 0),
    karbonhidrat: Math.round(karbDeger),
    karb: Math.round(karbDeger),
    yag: Math.round(Number(parsed.yag) || 0),
  };
}

/**
 * Ana Hibrit Fonksiyon: Önce Ürün Veritabanı -> Bulunamazsa Yapay Zeka
 */
export async function yemekAnalizEt(girdi: string): Promise<YemekAnalizSonuc> {
  const { gramaj, aramaMetni } = gramajAyikla(girdi);

  // 1. Aşama: Paketli ürün mü? Open Food Facts API'sinde ara
  if (aramaMetni.length >= 2) {
    const apiSonuc = await openFoodFactsAra(aramaMetni, gramaj);
    if (apiSonuc) {
      console.log("Veritabanından bulundu (OpenFoodFacts):", apiSonuc);
      return apiSonuc;
    }
  }

  // 2. Aşama: Veritabanında yoksa Groq AI'a sor
  console.log("Veritabanında bulunamadı, Groq AI analiz ediyor...");
  return await aiYemekAnalizEt(girdi);
}

export const analizEtYemek = yemekAnalizEt;