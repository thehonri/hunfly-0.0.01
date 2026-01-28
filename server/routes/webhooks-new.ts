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
import {
  getAccountFromInstanceId,
  getAccountFromPhoneNumberId,
  getTenantIdFromInstanceId,
  getTenantIdFromPhoneNumberId,
} from '../lib/tenant-resolver';

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
      res.status(500).json({ error: 'Webhook secret not configured' });
      return;
    }

    // Get raw body for signature verification
    const rawBody = JSON.stringify(req.body);

    if (!verifyEvolutionSignature(rawBody, signature, secret)) {
      Logger.warn('Invalid webhook signature from Evolution API', {
        correlationId,
        ip: req.ip,
      });
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Parse and validate payload
    const parsed = evolutionWebhookSchema.safeParse(req.body);

    if (!parsed.success) {
      Logger.warn('Invalid webhook payload from Evolution API', {
        correlationId,
        errors: parsed.error.flatten(),
      });
      res.status(400).json({
        error: 'Invalid payload',
        details: parsed.error.flatten(),
      });
      return;
    }

    const { event, instanceId, data } = parsed.data;

    // Extract tenantId + accountId from instanceId
    const accountResolution = instanceId ? await getAccountFromInstanceId(instanceId) : null;
    const tenantId = accountResolution?.tenantId || (instanceId ? await getTenantIdFromInstanceId(instanceId) : null);

    const jobId = await enqueueWebhookEvent({
      correlationId,
      tenantId,
      accountId: accountResolution?.accountId,
      provider: 'evolution',
      eventType: event,
      payload: { event, instanceId, data, accountId: accountResolution?.accountId },
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
    return;
  } catch (error) {
    Logger.error('Error processing Evolution webhook', {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
    return;
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
    res.status(500).json({ error: 'WHATSAPP_VERIFY_TOKEN not configured' });
    return;
  }

  if (mode === 'subscribe' && token === verifyToken && challenge) {
    Logger.info('Cloud API webhook verified');
    res.send(challenge);
    return;
  }

  res.status(403).json({ error: 'Invalid verification' });
  return;
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
      res.status(500).json({ error: 'App secret not configured' });
      return;
    }

    const rawBody = JSON.stringify(req.body);

    if (!verifyCloudAPISignature(rawBody, signature, appSecret)) {
      Logger.warn('Invalid webhook signature from Cloud API', {
        correlationId,
        ip: req.ip,
      });
      res.status(401).json({ error: 'Invalid signature' });
      return;
    }

    // Parse and validate payload
    const parsed = cloudApiWebhookSchema.safeParse(req.body);

    if (!parsed.success) {
      Logger.warn('Invalid webhook payload from Cloud API', {
        correlationId,
        errors: parsed.error.flatten(),
      });
      res.status(400).json({
        error: 'Invalid payload',
        details: parsed.error.flatten(),
      });
      return;
    }

    // Extract messages and statuses
    const messages = parsed.data.entry.flatMap((entry) =>
      entry.changes.flatMap((change) => {
        const value = change.value as Record<string, unknown>;
        const msgs = value.messages;
        return Array.isArray(msgs) ? msgs : [];
      })
    );

    const statuses = parsed.data.entry.flatMap((entry) =>
      entry.changes.flatMap((change) => {
        const value = change.value as Record<string, unknown>;
        const st = value.statuses;
        return Array.isArray(st) ? st : [];
      })
    );

    // Extract phone number ID for tenant resolution
    const firstValue = parsed.data.entry[0]?.changes[0]?.value as Record<string, unknown> | undefined;
    const metadata = firstValue?.metadata as Record<string, unknown> | undefined;
    const phoneNumberId = typeof metadata?.phone_number_id === 'string' ? metadata.phone_number_id : undefined;
    const accountResolution = phoneNumberId ? await getAccountFromPhoneNumberId(phoneNumberId) : null;
    const tenantId = accountResolution?.tenantId || (phoneNumberId ? await getTenantIdFromPhoneNumberId(phoneNumberId) : null);

    // Enqueue events
    if (messages.length > 0) {
      await enqueueWebhookEvent({
        correlationId,
        tenantId,
        accountId: accountResolution?.accountId,
        provider: 'cloud_api',
        eventType: 'MESSAGES_RECEIVED',
        payload: { messages, accountId: accountResolution?.accountId },
        receivedAt: new Date(),
      });
    }

    if (statuses.length > 0) {
      await enqueueWebhookEvent({
        correlationId,
        tenantId,
        accountId: accountResolution?.accountId,
        provider: 'cloud_api',
        eventType: 'MESSAGE_STATUS_UPDATE',
        payload: { statuses, accountId: accountResolution?.accountId },
        receivedAt: new Date(),
      });
    }

    Logger.info('Cloud API webhook enqueued', {
      correlationId,
      messagesCount: messages.length,
      statusesCount: statuses.length,
    });

    res.json({ ok: true, correlationId });
    return;
  } catch (error) {
    Logger.error('Error processing Cloud API webhook', {
      correlationId,
      error: error instanceof Error ? error.message : String(error),
    });
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

export { router as webhooksRouter };
