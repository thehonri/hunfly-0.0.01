/**
 * Webhook Routes (New Architecture)
 *
 * Secure webhook endpoints with:
 * - Signature validation
 * - Async processing via queue
 * - Idempotency
 * - Correlation ID tracking
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { verifyEvolutionSignature, verifyCloudAPISignature } from '../lib/webhook-security';
import { enqueueWebhookEvent } from '../queues/webhook-queue';
import { Logger } from '../lib/logger';

const router = Router();

// ========================================
// Evolution API Webhook
// ========================================

const evolutionWebhookSchema = z.object({
  event: z.string(),
  instanceId: z.string().optional(),
  data: z.unknown(),
});

router.post('/whatsapp/evolution', async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId || randomUUID();

  try {
    // Validate signature
    const signature = req.headers['x-webhook-signature'] as string;
    const secret = process.env.EVOLUTION_WEBHOOK_SECRET;

    if (!secret) {
      Logger.error('EVOLUTION_WEBHOOK_SECRET not configured', { correlationId });
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    if (!verifyEvolutionSignature(rawBody, signature, secret)) {
      Logger.warn('Invalid webhook signature from Evolution API', {
        correlationId,
        ip: req.ip,
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse and validate payload
    const parsed = evolutionWebhookSchema.safeParse(req.body);

    if (!parsed.success) {
      Logger.warn('Invalid webhook payload from Evolution API', {
        correlationId,
        errors: parsed.error.flatten(),
      });
      return res.status(400).json({
        error: 'Invalid payload',
        details: parsed.error.flatten(),
      });
    }

    const { event, instanceId, data } = parsed.data;

    // Extract tenantId from instanceId (you might have a mapping in DB)
    // For now, we'll need to query the database or use a convention
    // Placeholder: const tenantId = await getTenantIdFromInstanceId(instanceId);
    const tenantId = null; // TODO: Implement tenant resolution

    // Enqueue for async processing
    const jobId = await enqueueWebhookEvent({
      correlationId,
      tenantId,
      provider: 'evolution',
      eventType: event,
      payload: { event, instanceId, data },
      receivedAt: new Date(),
    });

    Logger.info('Evolution webhook enqueued', {
      correlationId,
      jobId,
      eventType: event,
      instanceId,
    });

    // Return 200 OK immediately (async processing)
    res.json({
      ok: true,
      correlationId,
      jobId,
    });
  } catch (error) {
    Logger.error('Error processing Evolution webhook', {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// Meta Cloud API Webhook
// ========================================

const cloudApiWebhookSchema = z.object({
  object: z.string(),
  entry: z.array(
    z.object({
      id: z.string(),
      changes: z.array(
        z.object({
          field: z.string(),
          value: z.unknown(),
        })
      ),
    })
  ),
});

// Verification endpoint (required by Meta)
router.get('/whatsapp/cloud-api', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (!verifyToken) {
    return res.status(500).json({ error: 'WHATSAPP_VERIFY_TOKEN not configured' });
  }

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    Logger.info('Cloud API webhook verified');
    return res.send(challenge);
  }

  res.status(403).json({ error: 'Invalid verification' });
});

// Webhook endpoint
router.post('/whatsapp/cloud-api', async (req: Request, res: Response) => {
  const correlationId = (req as any).correlationId || randomUUID();

  try {
    // Validate signature
    const signature = req.headers['x-hub-signature-256'] as string;
    const appSecret = process.env.WHATSAPP_APP_SECRET;

    if (!appSecret) {
      Logger.error('WHATSAPP_APP_SECRET not configured', { correlationId });
      return res.status(500).json({ error: 'App secret not configured' });
    }

    const rawBody = JSON.stringify(req.body);

    if (!verifyCloudAPISignature(rawBody, signature, appSecret)) {
      Logger.warn('Invalid webhook signature from Cloud API', {
        correlationId,
        ip: req.ip,
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse and validate payload
    const parsed = cloudApiWebhookSchema.safeParse(req.body);

    if (!parsed.success) {
      Logger.warn('Invalid webhook payload from Cloud API', {
        correlationId,
        errors: parsed.error.flatten(),
      });
      return res.status(400).json({
        error: 'Invalid payload',
        details: parsed.error.flatten(),
      });
    }

    // Extract messages and statuses
    const messages = parsed.data.entry.flatMap((entry) =>
      entry.changes.flatMap((change) => (change.value as any).messages ?? [])
    );

    const statuses = parsed.data.entry.flatMap((entry) =>
      entry.changes.flatMap((change) => (change.value as any).statuses ?? [])
    );

    // Enqueue events
    if (messages.length > 0) {
      await enqueueWebhookEvent({
        correlationId,
        tenantId: null, // TODO: Extract from phone number ID
        provider: 'cloud_api',
        eventType: 'MESSAGES_RECEIVED',
        payload: { messages },
        receivedAt: new Date(),
      });
    }

    if (statuses.length > 0) {
      await enqueueWebhookEvent({
        correlationId,
        tenantId: null,
        provider: 'cloud_api',
        eventType: 'MESSAGE_STATUS_UPDATE',
        payload: { statuses },
        receivedAt: new Date(),
      });
    }

    Logger.info('Cloud API webhook enqueued', {
      correlationId,
      messagesCount: messages.length,
      statusesCount: statuses.length,
    });

    res.json({ ok: true, correlationId });
  } catch (error) {
    Logger.error('Error processing Cloud API webhook', {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router as webhooksRouter };
