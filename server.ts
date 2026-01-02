import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { createClient } from '@supabase/supabase-js';
import { jwtVerify, SignJWT } from 'jose';
import QRCode from 'qrcode';

// whatsapp-web.js é CommonJS -> em ESM precisa default import:
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;

const app = express();
app.use(express.json({ limit: '2mb' }));

// Segurança HTTP
app.use(helmet());

// Rate limit (ajuste conforme necessidade)
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

// CORS estrito (NÃO use origin: '*')
const WEB_ORIGIN = process.env.WEB_ORIGIN;
if (!WEB_ORIGIN) throw new Error('WEB_ORIGIN is required in .env');

app.use(
  cors({
    origin: WEB_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

// Supabase (Service Role só no backend)
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// JWT curto para sessão WS
const APP_JWT_SECRET = process.env.APP_JWT_SECRET;
if (!APP_JWT_SECRET) throw new Error('APP_JWT_SECRET is required');
const jwtKey = new TextEncoder().encode(APP_JWT_SECRET);

// --------- Helpers de Auth ---------
async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing token' });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' });

    req.user = data.user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// --------- Rotas básicas ---------
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ id: req.user.id, email: req.user.email });
});

// --------- Live Session (WS token curto) ---------
app.post('/api/live-sessions', requireAuth, async (req, res) => {
  const meetingId = req.body.meetingId;
  if (!meetingId) return res.status(400).json({ error: 'meetingId is required' });

  const token = await new SignJWT({
    sub: req.user.id,
    meetingId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('10m')
    .sign(jwtKey);

  res.json({
    meetingId,
    wsUrl: `ws://localhost:3001/ws/live?token=${token}`,
    token,
  });
});

// --------- WhatsApp (QR + status + send) ---------
let latestQrDataUrl = null;
let whatsappReady = false;

const whatsapp = new Client({
  authStrategy: new LocalAuth({ dataPath: process.env.WHATSAPP_SESSION_DIR || '.wwebjs_auth' }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  },
});

whatsapp.on('qr', async (qr) => {
  latestQrDataUrl = await QRCode.toDataURL(qr);
  whatsappReady = false;
  console.log('[WhatsApp] QR updated');
});

whatsapp.on('ready', () => {
  whatsappReady = true;
  latestQrDataUrl = null;
  console.log('[WhatsApp] Ready');
});

whatsapp.on('disconnected', () => {
  whatsappReady = false;
  console.log('[WhatsApp] Disconnected');
});

whatsapp.initialize().catch(console.error);

app.get('/api/whatsapp/status', requireAuth, (_req, res) => {
  res.json({ connected: whatsappReady });
});

app.get('/api/whatsapp/qr', requireAuth, (_req, res) => {
  if (whatsappReady) return res.json({ connected: true, qr: null });
  return res.json({ connected: false, qr: latestQrDataUrl });
});

app.post('/api/whatsapp/send', requireAuth, async (req, res) => {
  try {
    if (!whatsappReady) return res.status(400).json({ error: 'WhatsApp not connected' });

    const { phone, message } = req.body || {};
    if (!phone || !message) return res.status(400).json({ error: 'phone and message are required' });

    const chatId = `${String(phone).replace(/\D/g, '')}@c.us`;
    const result = await whatsapp.sendMessage(chatId, String(message));

    res.json({ ok: true, id: result.id?.id || null });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed to send' });
  }
});

const PORT = 3001;
const server = app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server, path: '/ws/live' });

wss.on('connection', async (ws, req) => {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    if (!token) {
      ws.close(1008, 'Missing token');
      return;
    }

    const { payload } = await jwtVerify(token, jwtKey);
    const meetingId = payload.meetingId;
    const userId = payload.sub;

    ws.send(JSON.stringify({ type: 'connected', meetingId, userId }));

    ws.on('message', (data) => {
      if (data instanceof Buffer && data.length > 2_000_000) {
        ws.close(1009, 'Message too large');
        return;
      }

      ws.send(JSON.stringify({ type: 'ack' }));
    });

    ws.on('close', () => {});
  } catch {
    ws.close(1008, 'Invalid token');
  }
});