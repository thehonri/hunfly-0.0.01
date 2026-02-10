import { z } from "zod";

function getConfig() {
  const evolutionApiUrl = process.env.EVOLUTION_API_URL;
  const evolutionApiKey = process.env.EVOLUTION_API_KEY;

  if (!evolutionApiUrl) {
    throw new Error("EVOLUTION_API_URL is required");
  }

  return {
    url: evolutionApiUrl,
    headers: {
      "Content-Type": "application/json",
      ...(evolutionApiKey ? { apiKey: evolutionApiKey } : {}),
    },
  };
}

const sendMessageSchema = z.object({
  instanceId: z.string(),
  remoteJid: z.string(),
  message: z.string().min(1),
  quotedMessageId: z.string().optional(),
});

const sendTypingSchema = z.object({
  instanceId: z.string(),
  remoteJid: z.string(),
});

const syncHistorySchema = z.object({
  instanceId: z.string(),
  remoteJid: z.string(),
  limit: z.number().min(1).max(500).default(200),
});

const getConversationsSchema = z.object({
  instanceId: z.string(),
  limit: z.number().min(1).max(100).default(50),
});

async function request<T>(path: string, body?: unknown, method = "POST"): Promise<T> {
  const config = getConfig();
  const response = await fetch(`${config.url}${path}`, {
    method,
    headers: config.headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Evolution API error ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export const whatsappService = {
  async sendMessage(input: z.infer<typeof sendMessageSchema>) {
    const payload = sendMessageSchema.parse(input);
    return request("/message/sendText", {
      instanceId: payload.instanceId,
      remoteJid: payload.remoteJid,
      message: payload.message,
      quoted: payload.quotedMessageId ? { messageId: payload.quotedMessageId } : undefined,
    });
  },

  async sendTyping(input: z.infer<typeof sendTypingSchema>) {
    const payload = sendTypingSchema.parse(input);
    return request("/message/sendPresence", {
      instanceId: payload.instanceId,
      remoteJid: payload.remoteJid,
      presence: "composing",
    });
  },

  async syncHistory(input: z.infer<typeof syncHistorySchema>) {
    const payload = syncHistorySchema.parse(input);
    return request("/message/fetchHistory", {
      instanceId: payload.instanceId,
      remoteJid: payload.remoteJid,
      limit: payload.limit,
    });
  },

  async getConversations(input: z.infer<typeof getConversationsSchema>) {
    const payload = getConversationsSchema.parse(input);
    return request("/chat/list", {
      instanceId: payload.instanceId,
      limit: payload.limit,
    });
  },
};