import { Router } from "express";
import { z } from "zod";
import { db } from "../db";
import {
  whatsappMessages,
  whatsappChats,
  whatsappWebhooksRaw,
} from "../../drizzle/schema";

const webhookSchema = z.object({
  event: z.string(),
  instanceId: z.string().optional(),
  data: z.unknown(),
  userId: z.string(),
});

const messageUpsertSchema = z.object({
  key: z.object({
    id: z.string(),
    remoteJid: z.string(),
    fromMe: z.boolean(),
  }),
  messageTimestamp: z.number().optional(),
  pushName: z.string().optional(),
  message: z.record(z.unknown()).optional(),
  status: z.string().optional(),
  participant: z.string().optional(),
});

function normalizeStatus(status?: string) {
  if (!status) return "pending" as const;
  const normalized = status.toLowerCase();
  if (["pending", "sent", "delivered", "read", "error"].includes(normalized)) {
    return normalized as "pending" | "sent" | "delivered" | "read" | "error";
  }
  return "pending" as const;
}

const chatUpdateSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  unreadCount: z.number().optional(),
  archived: z.boolean().optional(),
  isGroup: z.boolean().optional(),
  pictureUrl: z.string().optional(),
  lastMessage: z.string().optional(),
  lastMessageTimestamp: z.number().optional(),
});

export function createWebhookRouter(broadcast: (payload: unknown) => void) {
  const router = Router();

  router.post("/whatsapp", async (req, res, next) => {
    try {
      const parsed = webhookSchema.parse(req.body);

      await db.insert(whatsappWebhooksRaw).values({
        userId: parsed.userId,
        eventType: parsed.event,
        payload: parsed,
      });

      if (parsed.event === "MESSAGES_UPSERT") {
        const messages = z.array(messageUpsertSchema).parse(parsed.data);

        for (const message of messages) {
          await db
            .insert(whatsappMessages)
            .values({
              userId: parsed.userId,
              messageId: message.key.id,
              remoteJid: message.key.remoteJid,
              pushName: message.pushName ?? null,
              chatId: message.key.remoteJid,
              from: message.key.fromMe ? parsed.userId : message.key.remoteJid,
              to: message.key.fromMe ? message.key.remoteJid : parsed.userId,
              body: JSON.stringify(message.message ?? {}),
              timestamp: message.messageTimestamp
                ? new Date(message.messageTimestamp * 1000)
                : new Date(),
              status: normalizeStatus(message.status),
              contextInfo: message.message ?? null,
              isFromMe: message.key.fromMe,
              hasMedia: false,
            })
            .onConflictDoUpdate({
              target: whatsappMessages.messageId,
              set: {
                status: normalizeStatus(message.status),
              },
            });
        }

        broadcast({ type: "whatsapp_messages_upsert", data: messages });
      }

      if (parsed.event === "CHATS_UPDATE") {
        const chats = z.array(chatUpdateSchema).parse(parsed.data);

        for (const chat of chats) {
          await db
            .insert(whatsappChats)
            .values({
              userId: parsed.userId,
              chatId: chat.id,
              name: chat.name ?? "",
              isGroup: chat.isGroup ?? false,
              unreadCount: chat.unreadCount ?? 0,
              pictureUrl: chat.pictureUrl ?? null,
              lastMessageContent: chat.lastMessage ?? null,
              isArchived: chat.archived ?? false,
              lastMessageAt: chat.lastMessageTimestamp
                ? new Date(chat.lastMessageTimestamp * 1000)
                : null,
            })
            .onConflictDoUpdate({
              target: whatsappChats.chatId,
              set: {
                name: chat.name ?? "",
                unreadCount: chat.unreadCount ?? 0,
                pictureUrl: chat.pictureUrl ?? null,
                lastMessageContent: chat.lastMessage ?? null,
                isArchived: chat.archived ?? false,
                lastMessageAt: chat.lastMessageTimestamp
                  ? new Date(chat.lastMessageTimestamp * 1000)
                  : null,
                updatedAt: new Date(),
              },
            });
        }

        broadcast({ type: "whatsapp_chats_update", data: chats });
      }

      res.json({ ok: true });
    } catch (error) {
      next(error);
    }
  });

  return router;
}