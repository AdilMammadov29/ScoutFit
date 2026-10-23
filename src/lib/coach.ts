import { Capacitor, CapacitorHttp } from "@capacitor/core";

export function yerelKoc(soru: string, kalori: number): string {
  const q = soru.toLocaleLowerCase("tr-TR");
  if (["naber", "merhaba", "selam", "hey", "nasılsın", "iyi günler"].some((k) => q.includes(k))) {
    return `Merhaba. Günlük hedefin ${kalori} kcal. Antrenman, öğün ya da tempo — hangisini açalım?`;
  }
  return `${kalori} kcal hedefini bozmadan sorunu antrenman ya da öğün olarak netleştirirsen daha kısa cevap veririm. Neyi değiştirmek istiyorsun?`;
}

export type ChatMesaji = {
  role: "system" | "user" | "assistant";
  content: string;
};

type KocGirdi = {
  soru: string;
  baglam?: string;
  gecmis?: ChatMesaji[];
};

export async function kocSor({ data }: { data: KocGirdi }) {
  const soru = String(data?.soru ?? "").trim().slice(0, 600);
  const baglam = String(data?.baglam ?? "").trim().slice(0, 500);

  if (!soru) return { ok: false as const, hata: "bos" };

  // Anahtar doğrudan sabitlendi (.env hatasını önler)
  const apiKey = "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";

  const sistemIcerik = `Sen ScoutFit profesyonel fitness koçusun.
Kullanıcı Profili: ${baglam || "belirtilmedi"}.

KESİN KURALLAR:
1. Asla her cümlene "Merhaba", "Selam", "Hoş geldin" gibi kalıplarla BAŞLAMA. Sohbet zaten akıyor, doğrudan soruya net ve samimi cevap ver.
2. Kesinlikle EMOJİ KULLANMA.
3. Konuşma geçmişini takip et, kullanıcının daha önce söylediği şeyleri hatırla.
4. Yanıtların sade, somut ve Türkçe olsun. Gereksiz dolandırma.`;

  const gonderilecekMesajlar: ChatMesaji[] = [
    { role: "system", content: sistemIcerik },
    ...(data.gecmis || []),
    { role: "user", content: soru },
  ];

  const payload = {
    model: "openai/gpt-oss-120b",
    temperature: 0.5,
    max_tokens: 700,
    messages: gonderilecekMesajlar,
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey.trim()}`,
  };

  try {
    let responseData: any;

    if (Capacitor.isNativePlatform()) {
      const res = await CapacitorHttp.post({
        url: "https://api.groq.com/openai/v1/chat/completions",
        headers,
        data: payload,
        connectTimeout: 30000,
        readTimeout: 30000,
      });

      if (res.status !== 200) {
        return {
          ok: true as const,
          metin: `API Hatası (${res.status}): ${JSON.stringify(res.data)}`,
        };
      }
      responseData = res.data;
    } else {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        return { ok: true as const, metin: `API Hatası (${res.status}): ${errText}` };
      }
      responseData = await res.json();
    }

    const text = responseData?.choices?.[0]?.message?.content?.trim() ?? "";
    if (text) return { ok: true as const, metin: text };

    return { ok: true as const, metin: "Koç boş yanıt döndürdü." };
  } catch (err: any) {
    return {
      ok: true as const,
      metin: `Bağlantı Hatası: ${err?.message || err?.toString() || "Bilinmeyen ağ hatası"}`,
    };
  }
}