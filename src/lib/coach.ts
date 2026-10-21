export function yerelKoc(soru: string, kalori: number): string {
  const q = soru.toLocaleLowerCase("tr-TR");
  if (["naber", "merhaba", "selam", "hey", "nasılsın", "iyi günler"].some((k) => q.includes(k))) {
    return `Selam! Günlük hedefin ${kalori} kcal. Bugün neyi planlıyoruz, antrenman mı beslenme mi?`;
  }
  return `${kalori} kcal hedefindeyiz. Konuyu antrenman ya da beslenme olarak netleştirirsen hemen yardımcı olurum.`;
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

  const sistemIcerik = `Sen ScoutFit'in kişisel fitness koçusun.
Kullanıcı Profili ve Bilgileri: ${baglam || "profil bilgisi henüz girilmemiş"}.

TEMEL KURALLAR VE HİTAP ADAPTASYONU:
1. Aynalama ve Hitap (En Önemli): Kullanıcının tarzına, enerjisine ve isteklerine %100 uyum sağla.
   - Kullanıcı sana "kanka / bro / reis / hocam" gibi samimi yaklaşıyorsa aynı samimiyetle cevap ver.
   - Kullanıcı resmi veya ciddi konuşuyorsa net, profesyonel bir koç gibi konuş.
   - Kullanıcı sana "Bana X diye hitap et" derse (örneğin "Bana patron de", "Bana adımla seslen"), bu hitabı anında benimse ve devam ettir.
2. Açılış Kalıpları: Her mesaja otomatik olarak "Merhaba", "Selam" diyerek başlama; konuşma akışına göre doğrudan konuya gir.
3. Hafıza: Profildeki veya sohbet geçmişindeki bilgileri (adı, kilosu, hedefleri) takip et. Adını veya durumunu sorduğunda doğru hatırla.
4. Netlik: Uzun, sıkıcı teorik nutuklar atma. Sade, uygulanabilir ve pratik adımlar sun.
5. Aşırı emoji kullanma; duruma göre en fazla 1 tane samimi emoji tercih edebilirsin.`;

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
        temperature: 0.6,
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