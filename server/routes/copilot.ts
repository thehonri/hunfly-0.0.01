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
} from "../../drizzle/schema";
import { and, eq } from "drizzle-orm";
import { requirePermission, type AuthenticatedRequest } from "../middleware/rbac";

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

    const suggestedText = "Bom dia! Vi sua mensagem e posso te ajudar a avançar com segurança. Quer que eu te mostre o próximo passo para fechar o produto X?";
    const reasoningSummary = [
      "Cliente informal e responde bem a CTA simples",
      "Momento adequado para proposta objetiva",
      "Reforçar benefício principal do produto X",
    ];

    const goalProgress = goal?.progress ?? 10;
    const goalText = goal?.goalText ?? "Vender produto X";

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

export { router as copilotRouter };
