import { NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { db } from "@/lib/db";
import { whatsappMessages } from "../../../../drizzle/schema";

const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
const appSecret = process.env.WHATSAPP_APP_SECRET;
const defaultUserId = process.env.WHATSAPP_DEFAULT_USER_ID;

const messageSchema = z.object({
  id: z.string(),
  from: z.string(),
  timestamp: z.string(),
  type: z.string(),
  text: z
    .object({
      body: z.string(),
    })
    .optional(),
  image: z.object({ id: z.string() }).optional(),
  audio: z.object({ id: z.string() }).optional(),
  document: z.object({ id: z.string() }).optional(),
});

const changeValueSchema = z
  .object({
    metadata: z
      .object({
        phone_number_id: z.string().optional(),
      })
      .optional(),
    messages: z.array(messageSchema).optional(),
  })
  .passthrough();

const webhookSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          field: z.string(),
          value: changeValueSchema,
        })
      ),
    })
  ),
});

function toUtcDate(timestamp: string): Date {
  const numeric = Number(timestamp);
  if (Number.isNaN(numeric)) {
    return new Date();
  }
  return new Date(numeric * 1000);
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!appSecret || !signatureHeader?.startsWith("sha256=")) return false;
  const expected = `sha256=${crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex")}`;
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signatureHeader, "utf8");
  if (expectedBuffer.length !== receivedBuffer.length) return false;
  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (!verifyToken) {
    return NextResponse.json({ error: "WHATSAPP_VERIFY_TOKEN não configurado" }, { status: 500 });
  }

  if (mode === "subscribe" && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Token inválido" }, { status: 403 });
}

export async function POST(request: Request) {
  try {
    if (!appSecret) {
      return NextResponse.json({ error: "WHATSAPP_APP_SECRET não configurado" }, { status: 500 });
    }
    if (!defaultUserId) {
      return NextResponse.json({ error: "WHATSAPP_DEFAULT_USER_ID não configurado" }, { status: 500 });
    }

    const rawBody = await request.text();
    const signature = request.headers.get("x-hub-signature-256");
    if (!verifySignature(rawBody, signature)) {
      return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
    }

    const payload = JSON.parse(rawBody) as unknown;
    const parsed = webhookSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Payload inválido", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const messages = parsed.data.entry.flatMap((entry) =>
      entry.changes.flatMap((change) => change.value.messages ?? [])
    );

    const statuses = parsed.data.entry.flatMap((entry) =>
      entry.changes.flatMap((change) => (change.value as { statuses?: unknown[] }).statuses ?? [])
    );

    if (messages.length > 0) {
      const phoneNumberId =
        parsed.data.entry[0]?.changes[0]?.value.metadata?.phone_number_id ?? "unknown";

      await db.insert(whatsappMessages).values(
        messages.map((message) => ({
          userId: defaultUserId,
          messageId: message.id,
          chatId: message.from,
          from: message.from,
          to: phoneNumberId,
          body: message.text?.body ?? null,
          timestamp: toUtcDate(message.timestamp),
          isFromMe: false,
          hasMedia: message.type !== "text",
          mediaType: message.type !== "text" ? message.type : null,
          mediaUrl: null,
        }))
      );
    }

    console.log("[WhatsApp Webhook] Evento recebido", {
      object: parsed.data.object,
      entries: parsed.data.entry.length,
      messages: messages.length,
      statuses: statuses.length,
    });

    if (statuses.length > 0) {
      console.log("[WhatsApp Webhook] Status recebidos", statuses);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[WhatsApp Webhook] Erro ao processar", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}