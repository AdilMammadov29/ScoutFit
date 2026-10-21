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

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.error("Groq API Key eksik!");
    return { ok: false as const, hata: "api_key_eksik" };
  }

  // Sistem talimatı
  const sistemIcerik = `Sen ScoutFit profesyonel fitness koçusun.
Kullanıcı Profili: ${baglam || "belirtilmedi"}.

KESİN KURALLAR:
1. Asla her cümlene "Merhaba", "Selam", "Hoş geldin" gibi kalıplarla BAŞLAMA. Sohbet zaten akıyor, doğrudan soruya net ve samimi cevap ver.
2. Kesinlikle EMOJİ KULLANMA.
3. Konuşma geçmişini takip et, kullanıcının daha önce söylediği şeyleri (örneğin adını veya durumunu) hatırla.
4. Yanıtların sade, somut ve Türkçe olsun. Gereksiz dolandırma.`;

  // Sohbet geçmişini hazırla (varsa geçmişi ekle, yoksa sadece son soruyu koy)
  const gonderilecekMesajlar: ChatMesaji[] = [
    { role: "system", content: sistemIcerik },
    ...(data.gecmis || []),
    { role: "user", content: soru },
  ];

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
        temperature: 0.5,
        max_tokens: 700,
        messages: gonderilecekMesajlar,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Koç API Hatası:", res.status, errBody);
      return { ok: false as const, hata: `http-${res.status}` };
    }

    const body = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const text = body.choices?.[0]?.message?.content?.trim() ?? "";
    if (text) return { ok: true as const, metin: text };

    return { ok: false as const, hata: "bos-yanit" };
  } catch (err) {
    console.error("Koç bağlantı hatası:", err);
    return { ok: false as const, hata: "ag" };
  }
}