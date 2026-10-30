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
    coach: "llama-3.3-70b-versatile",
    food: "llama-3.3-70b-versatile",
  },
};

export async function sendAIChatRequest(
  messages: ChatMessage[] | any[],
  options?: SendAIChatOptions | string
): Promise<string> {
  // Canlıda /api/chat yoluna gider
  const isLocal = typeof window !== "undefined" && window.location.hostname === "localhost";
  const baseUrl = isLocal ? "" : window.location.origin;
  const targetUrl = `${baseUrl}/api/chat`;

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

  const response = await fetch(targetUrl, {
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