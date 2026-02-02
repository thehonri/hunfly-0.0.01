import { Router, Response } from "express";
import { z } from "zod";
import { db } from "../db";
import {
  agents,
  companyKnowledgeItems,
  sellerKnowledgeItems,
  aiSuggestions,
  conversationGoals,
  threads,
  messages,
} from "../../drizzle/schema";
import { and, eq, desc } from "drizzle-orm";
import { requirePermission, type AuthenticatedRequest } from "../middleware/rbac";
import { generateSuggestion, generateMeetingSuggestion } from "../lib/ai-provider";

const router = Router();

const createAgentSchema = z.object({
  tenantId: z.string(),
  ownerMemberId: z.string().uuid(),
  name: z.string().min(2).max(120),
  avatarUrl: z.string().url().optional(),
  promptBase: z.string().max(5000).optional(),
});

router.post(
  "/agents",
  requirePermission("inbox.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createAgentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const [agent] = await db.insert(agents).values(parsed.data).returning();
    return res.json({ ok: true, agent });
  }
);

const listAgentsSchema = z.object({
  tenantId: z.string(),
  ownerMemberId: z.string().uuid(),
});

router.get(
  "/agents",
  requirePermission("inbox.read"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = listAgentsSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { tenantId, ownerMemberId } = parsed.data;
    const rows = await db.query.agents.findMany({
      where: and(eq(agents.tenantId, tenantId), eq(agents.ownerMemberId, ownerMemberId)),
    });

    return res.json({ ok: true, agents: rows });
  }
);

const createCompanyKnowledgeSchema = z.object({
  tenantId: z.string(),
  createdByMemberId: z.string().uuid(),
  title: z.string().min(2).max(255),
  type: z.enum(["text", "url", "pdf"]),
  content: z.string().min(2),
});

router.post(
  "/knowledge/company",
  requirePermission("settings.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createCompanyKnowledgeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const [item] = await db.insert(companyKnowledgeItems).values(parsed.data).returning();
    return res.json({ ok: true, item });
  }
);

const listCompanyKnowledgeSchema = z.object({
  tenantId: z.string(),
});

router.get(
  "/knowledge/company",
  requirePermission("inbox.read"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = listCompanyKnowledgeSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const rows = await db.query.companyKnowledgeItems.findMany({
      where: eq(companyKnowledgeItems.tenantId, parsed.data.tenantId),
    });

    return res.json({ ok: true, items: rows });
  }
);

const createSellerKnowledgeSchema = z.object({
  tenantId: z.string(),
  ownerMemberId: z.string().uuid(),
  title: z.string().min(2).max(255),
  type: z.enum(["text", "url", "pdf"]),
  content: z.string().min(2),
});

router.post(
  "/knowledge/personal",
  requirePermission("inbox.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = createSellerKnowledgeSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const [item] = await db.insert(sellerKnowledgeItems).values(parsed.data).returning();
    return res.json({ ok: true, item });
  }
);

const listSellerKnowledgeSchema = z.object({
  tenantId: z.string(),
  ownerMemberId: z.string().uuid(),
});

router.get(
  "/knowledge/personal",
  requirePermission("inbox.read"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = listSellerKnowledgeSchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const rows = await db.query.sellerKnowledgeItems.findMany({
      where: and(
        eq(sellerKnowledgeItems.tenantId, parsed.data.tenantId),
        eq(sellerKnowledgeItems.ownerMemberId, parsed.data.ownerMemberId)
      ),
    });

    return res.json({ ok: true, items: rows });
  }
);

const suggestionSchema = z.object({
  tenantId: z.string(),
  threadId: z.string().uuid(),
  agentId: z.string().uuid(),
  useCompanyBase: z.boolean().default(true),
  usePersonalBase: z.boolean().default(true),
});

router.post(
  "/suggestion",
  requirePermission("inbox.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = suggestionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { tenantId, threadId, agentId, useCompanyBase, usePersonalBase } = parsed.data;

    const thread = await db.query.threads.findFirst({
      where: and(eq(threads.id, threadId), eq(threads.tenantId, tenantId)),
    });

    if (!thread) {
      return res.status(404).json({ error: "thread_not_found" });
    }

    const goal = await db.query.conversationGoals.findFirst({
      where: and(eq(conversationGoals.threadId, threadId), eq(conversationGoals.tenantId, tenantId)),
    });

    // Buscar últimas 10 mensagens da conversa para contexto
    const recentMessages = await db.query.messages.findMany({
      where: and(eq(messages.threadId, threadId), eq(messages.tenantId, tenantId)),
      orderBy: desc(messages.timestamp),
      limit: 10,
    });

    // Montar contexto da conversa
    const conversationContext = recentMessages
      .reverse()
      .map((msg: { isFromMe: boolean; body: string }) => `${msg.isFromMe ? 'Vendedor' : 'Cliente'}: ${msg.body}`)
      .join('\n');

    // Buscar knowledge base
    let companyKnowledge: string[] = [];
    let personalKnowledge: string[] = [];

    if (useCompanyBase) {
      const companyItems = await db.query.companyKnowledgeItems.findMany({
        where: eq(companyKnowledgeItems.tenantId, tenantId),
      });
      companyKnowledge = companyItems.map((item: { title: string; content: string }) => `${item.title}: ${item.content}`);
    }

    if (usePersonalBase && req.membership) {
      const personalItems = await db.query.sellerKnowledgeItems.findMany({
        where: and(
          eq(sellerKnowledgeItems.tenantId, tenantId),
          eq(sellerKnowledgeItems.ownerMemberId, req.membership.id)
        ),
      });
      personalKnowledge = personalItems.map((item: { title: string; content: string }) => `${item.title}: ${item.content}`);
    }

    // Gerar sugestão com LLM
    const aiResult = await generateSuggestion({
      conversationContext,
      companyKnowledge,
      personalKnowledge,
      goal: goal?.goalText ?? 'Vender produto',
      customerName: thread.contactName ?? 'Cliente',
    });

    const suggestedText = aiResult.suggestedText;
    const reasoningSummary = aiResult.reasoningSummary;
    const goalProgress = goal?.progress ?? 10;
    const goalText = goal?.goalText ?? "Vender produto";

    const [suggestion] = await db.insert(aiSuggestions).values({
      tenantId,
      threadId,
      agentId,
      suggestedText,
      reasoningSummary,
      goalProgress,
      goalText,
    }).returning();

    return res.json({
      ok: true,
      suggestion,
      useCompanyBase,
      usePersonalBase,
    });
  }
);

/**
 * Endpoint para extensão de reuniões (Google Meet, Teams)
 * Gera sugestão rápida baseada em transcrição em tempo real
 */
const meetingSuggestionSchema = z.object({
  transcription: z.string().min(10),
  question: z.string().min(5),
});

router.post(
  "/meeting-suggestion",
  async (req: AuthenticatedRequest, res: Response) => {
    const parsed = meetingSuggestionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { transcription, question } = parsed.data;

    try {
      const suggestion = await generateMeetingSuggestion(transcription, question);
      return res.json({ ok: true, suggestion });
    } catch (error) {
      console.error('Error generating meeting suggestion:', error);
      return res.status(500).json({ error: "Failed to generate suggestion" });
    }
  }
);

export { router as copilotRouter };
