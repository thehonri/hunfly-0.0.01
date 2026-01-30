import { Router, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import { threads, messages } from "../../drizzle/schema";
import { desc, eq, and } from "drizzle-orm";
import { requirePermission, type AuthenticatedRequest } from "../middleware/rbac";
import { canOnlyAccessAssigned } from "../lib/permissions";
import { Logger } from "../lib/logger";
import { redisSub } from "../lib/redis";
import { EvolutionProvider } from "../providers/evolution-provider";

const router = Router();

const listThreadsSchema = z.object({
  tenantId: z.string(),
  accountId: z.string().uuid(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

router.get(
  "/threads",
  requirePermission("inbox.read"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = listThreadsSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { tenantId, accountId, limit, offset } = parsed.data;
    const onlyAssigned = req.membership ? canOnlyAccessAssigned(req.membership.role) : false;

    const whereClause = onlyAssigned
      ? and(
          eq(threads.tenantId, tenantId),
          eq(threads.accountId, accountId),
          eq(threads.assignedTo, req.membership!.id)
        )
      : and(eq(threads.tenantId, tenantId), eq(threads.accountId, accountId));

    const rows = await db.query.threads.findMany({
      where: whereClause,
      orderBy: desc(threads.lastMessageAt),
      limit,
      offset,
    });

    return res.json({ ok: true, threads: rows });
  }
);

const listMessagesSchema = z.object({
  tenantId: z.string(),
  threadId: z.string().uuid(),
  limit: z.coerce.number().min(1).max(200).default(50),
  offset: z.coerce.number().min(0).default(0),
});

router.get(
  "/messages",
  requirePermission("inbox.read"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = listMessagesSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { tenantId, threadId, limit, offset } = parsed.data;

    const rows = await db.query.messages.findMany({
      where: and(eq(messages.tenantId, tenantId), eq(messages.threadId, threadId)),
      orderBy: desc(messages.timestamp),
      limit,
      offset,
    });

    return res.json({ ok: true, messages: rows });
  }
);

router.get(
  "/events",
  // EventSource não suporta headers custom, então aceitamos token via query param
  // requirePermission("inbox.read"), // Comentado temporariamente
  async (req: any, res: Response) => {
    // Aceitar token via query OU header
    const token = (req.query.token as string) || req.headers.authorization?.split(' ')[1];

    // TODO: Validar token JWT aqui (por enquanto, passar sem validação em dev)
    if (!token && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { tenantId, accountId } = req.query as Record<string, string>;

    if (!tenantId || !accountId) {
      return res.status(400).json({ error: "tenantId and accountId are required" });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const channel = `account:${accountId}:inbox`;
    const onMessage = (message: string) => {
      res.write(`data: ${message}\n\n`);
    };

    await redisSub.subscribe(channel);
    const handler = (incomingChannel: string, message: string) => {
      if (incomingChannel === channel) {
        onMessage(message);
      }
    };
    redisSub.on("message", handler);

    req.on("close", async () => {
      try {
        redisSub.off("message", handler);
        await redisSub.unsubscribe(channel);
      } catch (error) {
        Logger.warn("SSE cleanup failed", {
          tenantId,
          accountId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });

    return;
  }
);

const sendMessageSchema = z.object({
  instanceId: z.string(),
  remoteJid: z.string(),
  message: z.string(),
  quotedMessageId: z.string().optional(),
});

router.post(
  "/send_message",
  requirePermission("inbox.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { instanceId, remoteJid, message, quotedMessageId } = parsed.data;

    try {
      const provider = new EvolutionProvider();
      const result = await provider.sendMessage({
        instanceId,
        remoteJid,
        message,
        quotedMessageId,
      });

      return res.json({ ok: true, messageId: result.messageId, status: result.status });
    } catch (error) {
      Logger.error("Failed to send message", {
        instanceId,
        remoteJid,
        error: error instanceof Error ? error.message : String(error),
      });
      return res.status(500).json({ error: "Failed to send message" });
    }
  }
);

export { router as inboxRouter };
