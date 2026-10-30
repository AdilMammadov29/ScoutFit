import { sendAIChatRequest, AI_CONFIG, ChatMessage } from "@/services/ai/client";

export function yerelKoc(soru: string, kalori: number): string {
  const q = soru.toLocaleLowerCase("tr-TR");
  if (["naber", "merhaba", "selam", "hey", "nasılsın", "iyi günler"].some((k) => q.includes(k))) {
    return `Merhaba! Günlük hedefin ${kalori} kcal. Antrenman, öğün ya da tempo — hangisini konuşalım?`;
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

  const sistemIcerik = `Sen ScoutFit uygulamasının kişisel antrenman ve beslenme koçusun.
Kullanıcı durumu: ${baglam || "Belirtilmedi"}.

Kurallar:
- Samimi, kısa ve net Türkçe konuş.
- Konuyu dağıtma, her zaman yardımcı ol.
- Sadece antrenman, beslenme, motivasyon ve sağlık konularında cevap ver.
- Kullanıcı "naber", "merhaba", "selam" gibi bir şey derse doğal ve samimi karşılık ver.
- Gereksiz uzun konuşma yapma.`;

  const messages: ChatMessage[] = [{ role: "system", content: sistemIcerik }];

  if (Array.isArray(data?.gecmis)) {
    for (const m of data.gecmis) {
      if (m?.content?.trim()) {
        messages.push({ role: m.role, content: m.content.trim() });
      }
    }
  }

  messages.push({ role: "user", content: soru });

  try {
    const metin = await sendAIChatRequest(messages, {
      model: AI_CONFIG.models.coach,
      temperature: 0.5,
      maxTokens: 600,
    });

    if (metin) return { ok: true, metin };
    return { ok: false, hata: "Koç yanıt üretemedi." };
  } catch (err: any) {
    return { ok: false, hata: err?.message || "Bağlantı hatası oluştu." };
  }
}