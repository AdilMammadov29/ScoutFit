import { Capacitor } from "@capacitor/core";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface SendAIChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  max_tokens?: number;
}

export const AI_CONFIG = {
  baseUrl: "/api/chat",
  models: {
    coach: "openai/gpt-oss-120b",
    food: "openai/gpt-oss-120b",
  },
};

export async function sendAIChatRequest(
  messages: ChatMessage[] | any[],
  options?: SendAIChatOptions | string
): Promise<string> {
  // Web'de aynı origin'deki /api/chat kullanılır (dev'de Vite proxy, canlıda Vercel).
  // APK'da göreli yol çalışmaz: VITE_API_BASE_URL (ör. https://scoutfit.vercel.app) zorunlu.
  const base = String(import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
  if (Capacitor.isNativePlatform() && !base) {
    throw new Error("AI adresi tanımlı değil: .env içine VITE_API_BASE_URL ekleyip yeniden build al.");
  }
  const targetUrl = `${base}/api/chat`;

  let selectedModel = AI_CONFIG.models.coach;
  let temperature = 0.7;
  let maxTokens = 1024;

  if (typeof options === "string") {
    selectedModel = options;
  } else if (options && typeof options === "object") {
    if (options.model) selectedModel = options.model;
    if (typeof options.temperature === "number") temperature = options.temperature;
    if (typeof options.maxTokens === "number") maxTokens = options.maxTokens;
    if (typeof options.max_tokens === "number") maxTokens = options.max_tokens;
  }

  let response: Response;
  try {
    response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: selectedModel,
      messages: messages,
      temperature: temperature,
      max_tokens: maxTokens,
    }),
    });
  } catch {
    throw new Error("AI sunucusuna ulaşılamadı. Bağlantını ve sunucunun çalıştığını kontrol et.");
  }

  if (!response.ok) {
    const errorBody = await response.text();
    let parsedMessage = errorBody;
    try {
      const json = JSON.parse(errorBody);
      parsedMessage = json.error?.message || json.error || errorBody;
    } catch {
      // ham metin kalır
    }
    throw new Error(`AI Hatası (${response.status}): ${parsedMessage}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}