import { ENV } from "./env";

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string;
};

type AnthropicContentBlock = {
  type?: string;
  text?: unknown;
};

export async function createAnthropicStream(params: {
  system: string;
  messages: AnthropicMessage[];
}) {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  return fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ENV.anthropicModel,
      max_tokens: Number.isFinite(ENV.anthropicMaxTokens)
        ? ENV.anthropicMaxTokens
        : 4096,
      system: params.system,
      messages: params.messages,
      stream: true,
    }),
  });
}

export async function createAnthropicMessage(params: {
  system: string;
  messages: AnthropicMessage[];
}): Promise<string> {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ENV.anthropicApiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ENV.anthropicModel,
      max_tokens: Number.isFinite(ENV.anthropicMaxTokens)
        ? ENV.anthropicMaxTokens
        : 4096,
      system: params.system,
      messages: params.messages,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Anthropic API error ${response.status}: ${body}`);
  }

  const payload = await response.json();
  const blocks: AnthropicContentBlock[] = Array.isArray(payload?.content) ? payload.content : [];
  return blocks
    .map((block) => (block?.type === "text" && typeof block.text === "string" ? block.text : ""))
    .join("");
}

export function extractAnthropicTextDelta(eventData: string): string | null {
  const parsed = JSON.parse(eventData);

  if (parsed?.type === "content_block_delta") {
    const delta = parsed.delta;
    if (delta?.type === "text_delta" && typeof delta.text === "string") {
      return delta.text;
    }
  }

  if (parsed?.type === "error") {
    const message = parsed.error?.message;
    throw new Error(typeof message === "string" ? message : "Anthropic stream error");
  }

  return null;
}

export function extractAnthropicStopReason(eventData: string): string | null {
  const parsed = JSON.parse(eventData);
  const stopReason = parsed?.delta?.stop_reason ?? parsed?.message?.stop_reason;
  return typeof stopReason === "string" ? stopReason : null;
}
