import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { WebSocketServer } from "ws";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify, SignJWT } from "jose";
import { upload } from "./server/uploads";
import { Logger } from "./server/lib/logger";
import { addCorrelationId } from "./server/middleware/correlation";
import { metricsMiddleware } from "./server/middleware/metrics";
import { getMetrics } from "./server/lib/metrics";
import { errorHandler } from "./server/middleware/error";
import { webhooksRouter } from "./server/routes/webhooks-new";
import { inboxRouter } from "./server/routes/inbox";
import { copilotRouter } from "./server/routes/copilot";
import whatsappConnectRouter from "./server/routes/whatsapp-connect.js";
import { whatsappService } from "./server/services/whatsappService";

const app = express();

/** =========================
 *  Config & Validations
 *  ========================= */
const PORT = Number(process.env.PORT || 3001);

const WEB_ORIGIN = process.env.WEB_ORIGIN;
if (!WEB_ORIGIN) throw new Error("WEB_ORIGIN is required in .env");

// Permite múltiplas origens (prod + staging + local)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || WEB_ORIGIN)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
}

const APP_JWT_SECRET = process.env.APP_JWT_SECRET;
if (!APP_JWT_SECRET) throw new Error("APP_JWT_SECRET is required");

const jwtKey = new TextEncoder().encode(APP_JWT_SECRET);

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/** =========================
 *  Middleware: Security
 *  ========================= */
app.disable("x-powered-by");

// JSON limit (evita abuso)
app.use(express.json({ limit: "1mb" }));

app.use(
  helmet({
    // Em app SPA, CSP pode quebrar se você não configurar. Deixa off por enquanto e ativa quando estabilizar.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS com allowlist
app.use(
  cors({
    origin: (origin, cb) => {
      // Permite requests sem origin (ex: curl, mobile apps, server-to-server)
      if (!origin) return cb(null, true);
      // Permite extensões Chrome (chrome-extension://...)
      if (origin.startsWith('chrome-extension://')) return cb(null, true);
      // Permite Google Meet e Teams (onde a extensão roda)
      if (origin === 'https://meet.google.com' || origin === 'https://teams.microsoft.com') {
        return cb(null, true);
      }
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limit global (leve)
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 240, // global leve
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Correlation ID (para tracing distribuído)
app.use(addCorrelationId);

// Prometheus metrics
app.use(metricsMiddleware);

// Logger Middleware de Requisições (com correlation ID)
app.use((req: any, _res, next) => {
  Logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    correlationId: req.correlationId,
  });
  next();
});

/** =========================
 *  Auth: Supabase JWT validate
 *  ========================= */
async function requireAuth(req: any, res: any, next: any) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: "Invalid token" });

    req.user = data.user;
    next();
  } catch (err) {
    next(err);
  }
}

/** =========================
 *  Routes
 *  ========================= */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/me", requireAuth, (req: any, res) => {
  res.json({ id: req.user.id, email: req.user.email });
});

// Prometheus metrics endpoint
app.get("/api/metrics", async (_req, res) => {
  const metrics = await getMetrics();
  res.set("Content-Type", "text/plain");
  res.send(metrics);
});

/** =========================
 *  Live Session (WS token curto)
 *  - Nota: wsUrl deve usar o host atual (não hardcode localhost)
 *  ========================= */
const liveSessionLimiter = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

app.post(
  "/api/live-sessions",
  requireAuth,
  liveSessionLimiter,
  async (req: any, res, next) => {
    try {
      const meetingId = req.body?.meetingId;
      if (!meetingId || typeof meetingId !== "string") {
        return res.status(400).json({ error: "meetingId is required" });
      }

      const token = await new SignJWT({
        sub: req.user.id,
        meetingId,
      })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("10m")
        .sign(jwtKey);

      const host = req.headers.host; // ex: localhost:3001 ou api.seudominio.com
      const proto = (req.headers["x-forwarded-proto"] as string) || "http";
      const wsProto = proto === "https" ? "wss" : "ws";

      res.json({
        meetingId,
        // importante: usa host real (funciona em prod atrás de proxy)
        wsUrl: `${wsProto}://${host}/ws/live?token=${token}`,
        token,
      });
      return;
    } catch (err) {
      next(err);
      return;
    }
  }
);

/** =========================
 *  WhatsApp Evolution (não-oficial)
 *  ========================= */

app.post("/api/inbox/send_message", requireAuth, async (req: any, res, next) => {
  try {
    const { instanceId, remoteJid, message, quotedMessageId } = req.body || {};
    const result = await whatsappService.sendMessage({
      instanceId,
      remoteJid,
      message,
      quotedMessageId,
    });
    res.json({ ok: true, result });
    return;
  } catch (err) {
    next(err);
    return;
  }
});

app.post("/api/inbox/send_typing", requireAuth, async (req: any, res, next) => {
  try {
    const { instanceId, remoteJid } = req.body || {};
    const result = await whatsappService.sendTyping({ instanceId, remoteJid });
    res.json({ ok: true, result });
    return;
  } catch (err) {
    next(err);
    return;
  }
});

app.post("/api/inbox/sync_history", requireAuth, async (req: any, res, next) => {
  try {
    const { instanceId, remoteJid, limit } = req.body || {};
    const result = await whatsappService.syncHistory({ instanceId, remoteJid, limit });
    res.json({ ok: true, result });
    return;
  } catch (err) {
    next(err);
    return;
  }
});

app.post("/api/inbox/get_conversations", requireAuth, async (req: any, res, next) => {
  try {
    const { instanceId, limit } = req.body || {};
    const result = await whatsappService.getConversations({ instanceId, limit });
    res.json({ ok: true, result });
    return;
  } catch (err) {
    next(err);
    return;
  }
});

// Upload de áudio de reuniões
app.post(
  "/api/meetings/:meetingId/audio",
  requireAuth,
  upload.single("audio"),
  async (req: any, res, next) => {
    try {
      const meetingId = req.params.meetingId;
      if (!meetingId)
        return res.status(400).json({ error: "meetingId é obrigatório" });

      if (!req.file)
        return res.status(400).json({ error: "Arquivo 'audio' é obrigatório" });

      // Aqui você salva no DB se quiser (meetingId, userId, file path, created_at)
      // Por enquanto só retorna sucesso.
      return res.json({
        ok: true,
        meetingId,
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    } catch (e: any) {
      next(e);
      return;
    }
  }
);

// Webhooks seguros com queue (novo)
app.use("/api/webhooks", webhooksRouter);

// Inbox (threads/messages + SSE)
app.use("/api/inbox", requireAuth, inboxRouter);

// Copiloto (agentes + base + sugestão) - com auth
app.use("/api/copilot", requireAuth, copilotRouter);

// Endpoint público para extensão de reuniões (sem auth)
// Usado pela extensão Chrome para sugestões em tempo real
import { generateMeetingSuggestion } from "./server/lib/ai-provider";
app.post("/api/extension/meeting-suggestion", async (req, res) => {
  try {
    const { transcription, question } = req.body || {};

    if (!transcription || transcription.length < 5) {
      return res.status(400).json({ error: "transcription is required (min 5 chars)" });
    }
    if (!question || question.length < 3) {
      return res.status(400).json({ error: "question is required (min 3 chars)" });
    }

    const suggestion = await generateMeetingSuggestion(transcription, question);
    return res.json({ ok: true, suggestion });
  } catch (error) {
    console.error('[Extension AI] Error:', error);
    return res.status(500).json({ error: "Failed to generate suggestion" });
  }
});

// WhatsApp Connection (QR Code + Status)
app.use("/api/whatsapp", whatsappConnectRouter);

// Centralized Error Handler (Always last)
app.use(errorHandler);

/** =========================
 *  Start HTTP + WebSocket
 *  ========================= */
const server = app.listen(PORT, () => {
  Logger.info(`API listening on http://localhost:${PORT}`);
});

/**
 * WebSocket: /ws/live
 * Segurança:
 * - token curto obrigatório
 * - valida origin
 * - rate limit por conexão
 * - limita tamanho por mensagem
 */
const wss = new WebSocketServer({ server, path: "/ws/live" });

// Webhook legado para compatibilidade (deprecado - remover após migração)
// app.use("/api/webhooks/legacy", createWebhookRouter(broadcast));

type ConnState = {
  msgCount: number;
  windowStart: number;
};

wss.on("connection", async (ws: any, req: any) => {
  // Origin check (evita que qualquer site abra WS no seu servidor)
  const origin = req.headers.origin;
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    ws.close(1008, "Bad origin");
    return;
  }

  const state: ConnState = { msgCount: 0, windowStart: Date.now() };

  try {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token");
    if (!token) {
      ws.close(1008, "Missing token");
      return;
    }

    const { payload } = await jwtVerify(token, jwtKey);
    const meetingId = payload.meetingId as string;
    const userId = payload.sub as string;

    ws.send(JSON.stringify({ type: "connected", meetingId, userId }));

    ws.on("message", (data: any) => {
      // Rate limit por conexão (ex: 60 msgs/min)
      const now = Date.now();
      if (now - state.windowStart > 60_000) {
        state.windowStart = now;
        state.msgCount = 0;
      }
      state.msgCount += 1;
      if (state.msgCount > 60) {
        ws.close(1013, "Rate limit");
        return;
      }

      // Limite de payload (anti DoS)
      if (data instanceof Buffer && data.length > 1_000_000) {
        ws.close(1009, "Message too large");
        return;
      }

      // Se vier JSON, valida tipo
      let parsed: any = null;
      try {
        parsed = JSON.parse(data.toString());
      } catch {
        // pode ser chunk binário no futuro; por enquanto exige JSON
        ws.send(JSON.stringify({ type: "error", error: "Invalid JSON payload" }));
        return;
      }

      const type = parsed?.type;
      if (!type || typeof type !== "string") {
        ws.send(JSON.stringify({ type: "error", error: "Missing type" }));
        return;
      }

      // Tipos permitidos no MVP
      const allowed = new Set(["audio_chunk", "partial_transcript", "ping"]);
      if (!allowed.has(type)) {
        ws.send(JSON.stringify({ type: "error", error: "Type not allowed" }));
        return;
      }

      // TODO: aqui você joga na fila/worker (transcrição/IA)
      // Exemplo:
      // enqueueAudioChunk({ meetingId, userId, ...parsed })
      ws.send(JSON.stringify({ type: "ack", receivedType: type }));
    });
  } catch {
    ws.close(1008, "Invalid token");
  }
});
