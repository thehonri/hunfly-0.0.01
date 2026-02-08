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
  salesMethodologies,
  extensionSessions,
  detectedPainPoints,
} from "../../drizzle/schema";
import { and, eq, desc, isNull, or } from "drizzle-orm";
import { requirePermission, type AuthenticatedRequest } from "../middleware/rbac";
import { generateSuggestion, generateMeetingSuggestion, detectPainPoints, generateQuickResponse, generateCheckpointTip } from "../lib/ai-provider";

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
      .map((msg) => `${msg.isFromMe ? 'Vendedor' : 'Cliente'}: ${msg.body || ''}`)
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

// ========================================
// EXTENSION ENDPOINTS (Intelligent Copilot)
// ========================================

/**
 * GET /api/copilot/extension/agents
 * Lista agentes do usuário autenticado para a extensão
 */
router.get(
  "/extension/agents",
  requirePermission("inbox.read"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.membership) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const rows = await db.query.agents.findMany({
      where: and(
        eq(agents.tenantId, req.membership.tenantId),
        eq(agents.ownerMemberId, req.membership.id)
      ),
    });

    return res.json({ ok: true, agents: rows });
  }
);

/**
 * GET /api/copilot/extension/methodologies
 * Lista metodologias disponíveis (padrão globais + custom do tenant)
 */
router.get(
  "/extension/methodologies",
  requirePermission("inbox.read"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.membership) {
      return res.status(401).json({ error: "unauthorized" });
    }

    // Buscar metodologias padrão (tenant_id IS NULL) + custom do tenant
    const rows = await db.query.salesMethodologies.findMany({
      where: or(
        isNull(salesMethodologies.tenantId),
        eq(salesMethodologies.tenantId, req.membership.tenantId)
      ),
    });

    return res.json({ ok: true, methodologies: rows });
  }
);

/**
 * POST /api/copilot/extension/session/start
 * Inicia uma nova sessão da extensão (uma por call)
 */
const startSessionSchema = z.object({
  agentId: z.string().uuid().optional(),
  methodologyId: z.string().uuid().optional(),
  platform: z.enum(["google_meet", "zoom", "teams", "other"]).default("google_meet"),
});

router.post(
  "/extension/session/start",
  requirePermission("inbox.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.membership) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const parsed = startSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { agentId, methodologyId, platform } = parsed.data;

    // Se agentId fornecido, buscar metodologia do agente
    let finalMethodologyId = methodologyId;
    let agent = null;

    if (agentId) {
      agent = await db.query.agents.findFirst({
        where: and(
          eq(agents.id, agentId),
          eq(agents.tenantId, req.membership.tenantId)
        ),
      });

      if (!agent) {
        return res.status(404).json({ error: "agent_not_found" });
      }

      // Usar metodologia do agente se não foi especificada
      if (!finalMethodologyId && agent.methodologyId) {
        finalMethodologyId = agent.methodologyId;
      }
    }

    // Buscar metodologia
    let methodology = null;
    if (finalMethodologyId) {
      methodology = await db.query.salesMethodologies.findFirst({
        where: eq(salesMethodologies.id, finalMethodologyId),
      });
    }

    // Se não tiver metodologia, usar SPIN como padrão
    if (!methodology) {
      methodology = await db.query.salesMethodologies.findFirst({
        where: and(
          isNull(salesMethodologies.tenantId),
          eq(salesMethodologies.name, "SPIN Selling")
        ),
      });
    }

    // Buscar knowledge base
    const companyKnowledge = await db.query.companyKnowledgeItems.findMany({
      where: eq(companyKnowledgeItems.tenantId, req.membership.tenantId),
    });

    const personalKnowledge = await db.query.sellerKnowledgeItems.findMany({
      where: and(
        eq(sellerKnowledgeItems.tenantId, req.membership.tenantId),
        eq(sellerKnowledgeItems.ownerMemberId, req.membership.id)
      ),
    });

    // Criar sessão
    const [session] = await db.insert(extensionSessions).values({
      tenantId: req.membership.tenantId,
      memberId: req.membership.id,
      agentId: agentId ?? null,
      methodologyId: methodology?.id ?? null,
      meetingPlatform: platform,
      checkpointsStatus: {},
      painPoints: [],
    }).returning();

    return res.json({
      ok: true,
      session,
      agent,
      methodology,
      knowledge: {
        company: companyKnowledge,
        personal: personalKnowledge,
      },
    });
  }
);

/**
 * POST /api/copilot/extension/session/end
 * Finaliza a sessão e salva o transcript final
 */
const endSessionSchema = z.object({
  sessionId: z.string().uuid(),
  transcript: z.string().optional(),
  checkpointsStatus: z.record(z.string()).optional(),
});

router.post(
  "/extension/session/end",
  requirePermission("inbox.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.membership) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const parsed = endSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { sessionId, transcript, checkpointsStatus } = parsed.data;

    // Verificar se sessão pertence ao usuário
    const session = await db.query.extensionSessions.findFirst({
      where: and(
        eq(extensionSessions.id, sessionId),
        eq(extensionSessions.memberId, req.membership.id)
      ),
    });

    if (!session) {
      return res.status(404).json({ error: "session_not_found" });
    }

    // Atualizar sessão
    const [updated] = await db.update(extensionSessions)
      .set({
        transcript: transcript ?? session.transcript,
        checkpointsStatus: checkpointsStatus ?? session.checkpointsStatus,
        endedAt: new Date(),
      })
      .where(eq(extensionSessions.id, sessionId))
      .returning();

    return res.json({ ok: true, session: updated });
  }
);

/**
 * POST /api/copilot/extension/detect-pains
 * Detecta dores do cliente usando IA
 */
const detectPainsSchema = z.object({
  sessionId: z.string().uuid(),
  transcript: z.string().min(20),
});

router.post(
  "/extension/detect-pains",
  requirePermission("inbox.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.membership) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const parsed = detectPainsSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { sessionId, transcript } = parsed.data;

    // Verificar se sessão pertence ao usuário
    const session = await db.query.extensionSessions.findFirst({
      where: and(
        eq(extensionSessions.id, sessionId),
        eq(extensionSessions.memberId, req.membership.id)
      ),
    });

    if (!session) {
      return res.status(404).json({ error: "session_not_found" });
    }

    try {
      // Chamar IA para detectar dores
      const pains = await detectPainPoints(transcript);

      // Salvar dores detectadas
      const insertedPains = [];
      for (const pain of pains) {
        const [inserted] = await db.insert(detectedPainPoints).values({
          sessionId,
          painText: pain.pain,
          context: pain.quote,
          source: "ai_detected",
        }).returning();
        insertedPains.push(inserted);
      }

      return res.json({ ok: true, pains: insertedPains });
    } catch (error) {
      console.error('Error detecting pains:', error);
      return res.status(500).json({ error: "Failed to detect pains" });
    }
  }
);

/**
 * POST /api/copilot/extension/pain/add
 * Adiciona dor manualmente
 */
const addPainSchema = z.object({
  sessionId: z.string().uuid(),
  painText: z.string().min(3),
  context: z.string().optional(),
});

router.post(
  "/extension/pain/add",
  requirePermission("inbox.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.membership) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const parsed = addPainSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { sessionId, painText, context } = parsed.data;

    // Verificar se sessão pertence ao usuário
    const session = await db.query.extensionSessions.findFirst({
      where: and(
        eq(extensionSessions.id, sessionId),
        eq(extensionSessions.memberId, req.membership.id)
      ),
    });

    if (!session) {
      return res.status(404).json({ error: "session_not_found" });
    }

    const [pain] = await db.insert(detectedPainPoints).values({
      sessionId,
      painText,
      context,
      source: "manual",
    }).returning();

    return res.json({ ok: true, pain });
  }
);

/**
 * PATCH /api/copilot/extension/pain/:painId/toggle
 * Marca dor como resolvida/não resolvida
 */
router.patch(
  "/extension/pain/:painId/toggle",
  requirePermission("inbox.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.membership) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const painId = req.params.painId as string;

    // Buscar pain point
    const pain = await db.query.detectedPainPoints.findFirst({
      where: eq(detectedPainPoints.id, painId),
    });

    if (!pain) {
      return res.status(404).json({ error: "pain_not_found" });
    }

    // Verificar se sessão pertence ao usuário
    const session = await db.query.extensionSessions.findFirst({
      where: and(
        eq(extensionSessions.id, pain.sessionId),
        eq(extensionSessions.memberId, req.membership.id)
      ),
    });

    if (!session) {
      return res.status(404).json({ error: "session_not_found" });
    }

    // Toggle is_addressed
    const [updated] = await db.update(detectedPainPoints)
      .set({ isAddressed: !pain.isAddressed })
      .where(eq(detectedPainPoints.id, painId))
      .returning();

    return res.json({ ok: true, pain: updated });
  }
);

/**
 * POST /api/copilot/extension/quick-response
 * CTRL+\ - Gera resposta rápida baseada no transcript recente
 */
const quickResponseSchema = z.object({
  sessionId: z.string().uuid(),
  transcript: z.string().min(10),
});

router.post(
  "/extension/quick-response",
  requirePermission("inbox.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.membership) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const parsed = quickResponseSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { sessionId, transcript } = parsed.data;

    // Buscar sessão com agente e knowledge
    const session = await db.query.extensionSessions.findFirst({
      where: and(
        eq(extensionSessions.id, sessionId),
        eq(extensionSessions.memberId, req.membership.id)
      ),
    });

    if (!session) {
      return res.status(404).json({ error: "session_not_found" });
    }

    // Buscar agente se existir
    let agentPrompt = "";
    if (session.agentId) {
      const agent = await db.query.agents.findFirst({
        where: eq(agents.id, session.agentId),
      });
      if (agent?.promptBase) {
        agentPrompt = agent.promptBase;
      }
    }

    // Buscar knowledge base
    const companyKnowledge = await db.query.companyKnowledgeItems.findMany({
      where: eq(companyKnowledgeItems.tenantId, req.membership.tenantId),
    });

    const knowledgeContext = companyKnowledge
      .map((item: { title: string; content: string }) => `${item.title}: ${item.content}`)
      .join('\n');

    try {
      const response = await generateQuickResponse(transcript, agentPrompt, knowledgeContext);
      return res.json({ ok: true, ...response });
    } catch (error) {
      console.error('Error generating quick response:', error);
      return res.status(500).json({ error: "Failed to generate response" });
    }
  }
);

/**
 * POST /api/copilot/extension/checkpoint-tip
 * Gera dica para completar um checkpoint
 */
const checkpointTipSchema = z.object({
  sessionId: z.string().uuid(),
  checkpointId: z.string(),
  transcript: z.string().min(10),
});

router.post(
  "/extension/checkpoint-tip",
  requirePermission("inbox.write"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.membership) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const parsed = checkpointTipSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "invalid_params", details: parsed.error.flatten() });
    }

    const { sessionId, checkpointId, transcript } = parsed.data;

    // Buscar sessão
    const session = await db.query.extensionSessions.findFirst({
      where: and(
        eq(extensionSessions.id, sessionId),
        eq(extensionSessions.memberId, req.membership.id)
      ),
    });

    if (!session) {
      return res.status(404).json({ error: "session_not_found" });
    }

    // Buscar metodologia
    let methodology = null;
    if (session.methodologyId) {
      methodology = await db.query.salesMethodologies.findFirst({
        where: eq(salesMethodologies.id, session.methodologyId),
      });
    }

    if (!methodology) {
      return res.status(400).json({ error: "methodology_not_found" });
    }

    // Encontrar checkpoint
    const checkpoints = methodology.checkpoints as Array<{
      id: string;
      label: string;
      description: string;
      tip: string;
    }>;

    const checkpoint = checkpoints.find(c => c.id === checkpointId);
    if (!checkpoint) {
      return res.status(400).json({ error: "checkpoint_not_found" });
    }

    try {
      const tip = await generateCheckpointTip(
        methodology.name,
        checkpoint.label,
        checkpoint.description,
        transcript
      );
      return res.json({ ok: true, tip, checkpoint });
    } catch (error) {
      console.error('Error generating checkpoint tip:', error);
      return res.status(500).json({ error: "Failed to generate tip" });
    }
  }
);

/**
 * GET /api/copilot/extension/session/:sessionId/pains
 * Lista dores de uma sessão
 */
router.get(
  "/extension/session/:sessionId/pains",
  requirePermission("inbox.read"),
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.membership) {
      return res.status(401).json({ error: "unauthorized" });
    }

    const sessionId = req.params.sessionId as string;

    // Verificar se sessão pertence ao usuário
    const session = await db.query.extensionSessions.findFirst({
      where: and(
        eq(extensionSessions.id, sessionId),
        eq(extensionSessions.memberId, req.membership.id)
      ),
    });

    if (!session) {
      return res.status(404).json({ error: "session_not_found" });
    }

    const pains = await db.query.detectedPainPoints.findMany({
      where: eq(detectedPainPoints.sessionId, sessionId),
    });

    return res.json({ ok: true, pains });
  }
);

export { router as copilotRouter };
