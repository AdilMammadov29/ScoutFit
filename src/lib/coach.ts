import { Capacitor, CapacitorHttp } from "@capacitor/core";

export function yerelKoc(soru: string, kalori: number): string {
  const q = soru.toLocaleLowerCase("tr-TR");
  if (["naber", "merhaba", "selam", "hey", "nasılsın", "iyi günler"].some((k) => q.includes(k))) {
    return `Merhaba. Günlük hedefin ${kalori} kcal. Antrenman, öğün ya da tempo — hangisini açalım?`;
  }
  return `${kalori} kcal hedefini bozmadan sorunu antrenman ya da öğün olarak netleştirirsen daha kısa cevap veririm. Neyi değiştirmek istiyorsun?`;
}

export interface ChatMesaji {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface KocGirdi {
  soru: string;
  baglam?: string;
  gecmis?: ChatMesaji[];
}

export async function kocSor({ data }: { data: KocGirdi }): Promise<{ ok: boolean; metin?: string; hata?: string }> {
  const soru = String(data?.soru ?? "").trim();
  const baglam = String(data?.baglam ?? "").trim();

  if (!soru) return { ok: false, hata: "Soru boş bırakılamaz." };

  const apiKey = "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";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const sistemIcerik = `Sen ScoutFit profesyonel fitness koçusun.
Kullanıcı Durumu: ${baglam || "Belirtilmedi"}.

KURALLAR:
1. Selamlama kalıpları (Merhaba, Selam) kullanma, doğrudan soruya cevap ver.
2. Kesinlikle EMOJİ KULLANMA.
3. Sade, motive edici ve Türkçe yanıt ver.`;

  const temizMesajlar: { role: "system" | "user" | "assistant"; content: string }[] = [
    { role: "system", content: sistemIcerik },
  ];

  if (Array.isArray(data?.gecmis)) {
    for (const m of data.gecmis) {
      if (m && typeof m.content === "string" && m.content.trim().length > 0) {
        if (m.role === "user" || m.role === "assistant") {
          temizMesajlar.push({ role: m.role, content: m.content.trim() });
        }
      }
    }
  }

  temizMesajlar.push({ role: "user", content: soru });

  // Groq'un güncel ve aktif üretim modeli
  const payload = {
    model: "openai/gpt-oss-120b",
    temperature: 0.5,
    max_tokens: 600,
    messages: temizMesajlar,
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey.trim()}`,
  };

  try {
    let rawText = "";

    if (Capacitor.isNativePlatform()) {
      const res = await CapacitorHttp.post({
        url,
        headers,
        data: payload,
        connectTimeout: 20000,
        readTimeout: 20000,
      });

      if (res.status !== 200) {
        const errDetail = typeof res.data === "object" ? JSON.stringify(res.data) : String(res.data);
        return { ok: false, hata: `Groq Hatası (${res.status}): ${errDetail.slice(0, 150)}` };
      }

      const d = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      rawText = d?.choices?.[0]?.message?.content?.trim() || "";
    } else {
      const res = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errDetail = await res.text();
        return { ok: false, hata: `Web Hatası (${res.status}): ${errDetail.slice(0, 150)}` };
      }

      const d = await res.json();
      rawText = d?.choices?.[0]?.message?.content?.trim() || "";
    }

    if (rawText) {
      return { ok: true, metin: rawText };
    }

    return { ok: false, hata: "Koç yanıt üretemedi." };
  } catch (err: any) {
    return { ok: false, hata: `Bağlantı Hatası: ${err?.message || String(err)}` };
  }
}