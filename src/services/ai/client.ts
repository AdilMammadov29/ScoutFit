import { Capacitor, CapacitorHttp } from "@capacitor/core";

// ==========================================
// TEK MERKEZİ YAPILANDIRMA: Sadece Burayı Değiş!
// ==========================================
export const AI_CONFIG = {
  // Vercel'deki şifreyi alır, bulamazsa boş string döner (TypeScript hatasını önler)
  apiKey: (import.meta.env.VITE_GROQ_API_KEY as string) || "", 
  baseUrl: "https://api.groq.com/openai/v1/chat/completions",
  models: {
    coach: "openai/gpt-oss-20b",
    food: "openai/gpt-oss-20b",
  },
};

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface RequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Hem Web hem Mobil (Capacitor) ortamında çalışan merkezi istek motoru
 */
export async function sendAIChatRequest(
  messages: ChatMessage[],
  options: RequestOptions = {}
): Promise<string> {
  const model = options.model || AI_CONFIG.models.coach;
  const temperature = options.temperature ?? 0.3;
  const max_tokens = options.maxTokens ?? 600;

  // Şifre Vercel'den gelmezse hata fırlatıp çökmesini engeller
  if (!AI_CONFIG.apiKey) {
    console.warn("GROQ API Key bulunamadı! Lütfen Vercel 'Environment Variables' kısmına VITE_GROQ_API_KEY ekleyin.");
    return "Yapay zeka koçu şu anda ayarlanamadı. Lütfen sistem yöneticisinin (Vercel) API anahtarını eklemesini bekleyin.";
  }

  console.log("--> GROQ ISTEGI ATILIYOR | Model:", model, "| URL:", AI_CONFIG.baseUrl);

  const payload = {
    model,
    temperature,
    max_tokens,
    messages,
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${AI_CONFIG.apiKey.trim()}`,
  };

  // Capacitor Mobil Ortamı
  if (Capacitor.isNativePlatform()) {
    const res = await CapacitorHttp.post({
      url: AI_CONFIG.baseUrl,
      headers,
      data: payload,
      connectTimeout: 20000,
      readTimeout: 20000,
    });

    if (res.status !== 200) {
      const detail = typeof res.data === "object" ? JSON.stringify(res.data) : String(res.data);
      throw new Error(`Groq Mobil Hatası (${res.status}): ${detail}`);
    }

    const json = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
    return json?.choices?.[0]?.message?.content?.trim() || "";
  }

  // Web / Vite Ortamı
  const res = await fetch(AI_CONFIG.baseUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq Web Hatası (${res.status}): ${errorText}`);
  }

  const json = await res.json();
  return json?.choices?.[0]?.message?.content?.trim() || "";
}