import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { WebSocketServer } from "ws";
import { createClient } from "@supabase/supabase-js";
import { jwtVerify, SignJWT } from "jose";
import QRCode from "qrcode";

// whatsapp-web.js é CommonJS -> em ESM precisa default import:
import pkg from "whatsapp-web.js";
const { Client, LocalAuth } = pkg;

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
  }),
);

// CORS com allowlist
app.use(
  cors({
    origin: (origin, cb) => {
      // Permite requests sem origin (ex: curl, mobile apps, server-to-server)
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      return cb(new Error("Not allowed by CORS"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Rate limit global (leve)
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 240, // global leve
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

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
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

/** =========================
 *  Helpers: Validation
 *  ========================= */
function sanitizePhone(phone: string): string {
  // Espera DDI+DDD+numero, ex: 5548999999999
  const digits = String(phone || "").replace(/\D/g, "");
  // valida tamanho básico (Brasil normalmente 12-13 com DDI)
  if (digits.length < 11 || digits.length > 15) throw new Error("Invalid phone length");
  return digits;
}

function sanitizeMessage(message: string): string {
  const text = String(message || "").trim();
  if (!text) throw new Error("Empty message");
  if (text.length > 2000) throw new Error("Message too long");
  return text;
}

/** =========================
 *  Routes
 *  ========================= */
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/me", requireAuth, (req: any, res) => {
  res.json({ id: req.user.id, email: req.user.email });
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

app.post("/api/live-sessions", requireAuth, liveSessionLimiter, async (req: any, res) => {
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
});

/** =========================
 *  WhatsApp (QR + status + init + logout + send)
 *  ========================= */
let latestQrDataUrl: string | null = null;
let latestQrAt: number | null = null;
let whatsappReady = false;
let whatsappInitializing = false;

// WhatsApp client (MVP: 1 instância)
// Futuro: criar uma instância por org_id
const whatsapp = new Client({
  authStrategy: new LocalAuth({
    clientId: "ascend-sales-engine",
    dataPath: process.env.WHATSAPP_SESSION_DIR || ".wwebjs_auth",
  }),
  puppeteer: {
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
});

function isQrFresh() {
  if (!latestQrAt) return false;
  // QR expira rápido; mantemos 60s como "fresh"
  return Date.now() - latestQrAt < 60_000;
}

whatsapp.on("qr", async (qr: string) => {
  latestQrDataUrl = await QRCode.toDataURL(qr);
  latestQrAt = Date.now();
  whatsappReady = false;
  whatsappInitializing = false;
  console.log("[WhatsApp] QR updated");
});

whatsapp.on("ready", () => {
  whatsappReady = true;
  whatsappInitializing = false;
  latestQrDataUrl = null;
  latestQrAt = null;
  console.log("[WhatsApp] Ready");
});

whatsapp.on("disconnected", (reason: any) => {
  whatsappReady = false;
  whatsappInitializing = false;
  console.log("[WhatsApp] Disconnected:", reason);
});

whatsapp.on("auth_failure", (msg: any) => {
  whatsappReady = false;
  whatsappInitializing = false;
  console.log("[WhatsApp] Auth failure:", msg);
});

// inicializa no boot
whatsappInitializing = true;
whatsapp.initialize().catch((e: any) => {
  whatsappInitializing = false;
  console.error("[WhatsApp] init error:", e?.message || e);
});

app.get("/api/whatsapp/status", requireAuth, (_req, res) => {
  res.json({
    connected: whatsappReady,
    initializing: whatsappInitializing,
  });
});

app.get("/api/whatsapp/qr", requireAuth, (_req, res) => {
  if (whatsappReady) return res.json({ connected: true, qr: null });

  // evita devolver QR velho
  if (!latestQrDataUrl || !isQrFresh()) {
    return res.json({ connected: false, qr: null, hint: "QR not available yet. Try again." });
  }
  return res.json({ connected: false, qr: latestQrDataUrl });
});

// Força (re)inicialização — útil quando caiu sessão
app.post("/api/whatsapp/init", requireAuth, async (_req, res) => {
  try {
    if (whatsappReady) return res.json({ ok: true, connected: true });

    if (!whatsappInitializing) {
      whatsappInitializing = true;
      whatsapp.initialize().catch((e: any) => {
        whatsappInitializing = false;
        console.error("[WhatsApp] re-init error:", e?.message || e);
      });
    }
    res.json({ ok: true, connected: false, initializing: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to init WhatsApp" });
  }
});

// Logout/disconnect (manual)
app.post("/api/whatsapp/logout", requireAuth, async (_req, res) => {
  try {
    await whatsapp.destroy();
    whatsappReady = false;
    whatsappInitializing = false;
    latestQrDataUrl = null;
    latestQrAt = null;

    // recria sessão para re-QR
    whatsappInitializing = true;
    whatsapp.initialize().catch((e: any) => {
      whatsappInitializing = false;
      console.error("[WhatsApp] init error after logout:", e?.message || e);
    });

    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || "Failed to logout WhatsApp" });
  }
});

// Rate limit extra para envio (evita abuso)
const whatsappSendLimiter = rateLimit({
  windowMs: 60_000,
  max: 20, // 20/min por IP (pode refinar por user depois)
  standardHeaders: true,
  legacyHeaders: false,
});

app.post("/api/whatsapp/send", requireAuth, whatsappSendLimiter, async (req, res) => {
  try {
    if (!whatsappReady) return res.status(400).json({ error: "WhatsApp not connected" });

    const phone = sanitizePhone(req.body?.phone);
    const message = sanitizeMessage(req.body?.message);

    const chatId = `${phone}@c.us`;
    const result = await whatsapp.sendMessage(chatId, message);

    res.json({ ok: true, id: result?.id?.id || null });
  } catch (e: any) {
    res.status(400).json({ error: e?.message || "Failed to send" });
  }
});

/** =========================
 *  Start HTTP + WebSocket
 *  ========================= */
const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
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
import { upload } from "./uploads";

// ...

app.post(
  "/api/meetings/:meetingId/audio",
  requireAuth,
  upload.single("audio"),
  async (req: any, res) => {
    try {
      const meetingId = req.params.meetingId;
      if (!meetingId) return res.status(400).json({ error: "meetingId é obrigatório" });

      if (!req.file) return res.status(400).json({ error: "Arquivo 'audio' é obrigatório" });

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
      return res.status(500).json({ error: e?.message || "Falha no upload" });
    }
  }
);
});