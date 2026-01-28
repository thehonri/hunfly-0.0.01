/**
 * Webhook Worker
 *
 * Processes webhook events from BullMQ queue
 */

import { Worker, Job } from 'bullmq';
import { bullmqConnection, redis, redisPub } from '../lib/redis';
import { Logger } from '../lib/logger';
import { db } from '../db';
import { webhookEventsRaw, messages, threads, whatsappAccounts } from '../../drizzle/schema';
import { WebhookJobData } from '../queues/webhook-queue';
import { eq, and } from 'drizzle-orm';

/**
 * Check if event was already processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const key = `processed:${eventId}`;
  const exists = await redis.get(key);
  return exists !== null;
}

/**
 * Mark event as processed
 */
async function markEventProcessed(eventId: string): Promise<void> {
  const key = `processed:${eventId}`;
  await redis.setex(key, 86400, '1'); // 24h TTL
}

/**
 * Process MESSAGES_UPSERT event from Evolution API
 */
async function processMessagesUpsert(
  jobData: WebhookJobData,
  messagesData: any[]
): Promise<void> {
  const { tenantId, correlationId, accountId: accountIdFromJob } = jobData;

  if (!tenantId) {
    Logger.warn('Cannot process message without tenantId', { correlationId });
    return;
  }

  for (const msg of messagesData) {
    const messageId = msg.key?.id;
    const remoteJid = msg.key?.remoteJid;

    if (!messageId || !remoteJid) {
      Logger.warn('Message missing required fields', { correlationId, msg });
      continue;
    }

    // Check idempotency
    if (await isEventProcessed(messageId)) {
      Logger.debug('Message already processed', { correlationId, messageId });
      continue;
    }

    try {
      // Find or create thread
      let thread = await db.query.threads.findFirst({
        where: and(
          eq(threads.tenantId, tenantId),
          eq(threads.remoteJid, remoteJid)
        ),
      });

      if (!thread) {
        const account = accountIdFromJob
          ? await db.query.whatsappAccounts.findFirst({
              where: eq(whatsappAccounts.id, accountIdFromJob),
            })
          : await db.query.whatsappAccounts.findFirst({
              where: eq(whatsappAccounts.tenantId, tenantId),
            });

        if (!account) {
          Logger.error('No WhatsApp account found for tenant', { tenantId, correlationId });
          continue;
        }

        // Create new thread
        const [newThread] = await db.insert(threads).values({
          tenantId,
          accountId: account.id,
          remoteJid,
          contactName: msg.pushName || remoteJid,
          contactPhone: remoteJid.split('@')[0],
          isGroup: remoteJid.endsWith('@g.us'),
          status: 'open',
        }).returning();

        thread = newThread;
      }

      // Extract message body
      const body = extractMessageBody(msg.message);

      // Insert or update message
      await db.insert(messages).values({
        tenantId,
        threadId: thread.id,
        messageId,
        remoteJid,
        fromJid: msg.key.fromMe ? 'me' : remoteJid,
        toJid: msg.key.fromMe ? remoteJid : 'me',
        isFromMe: msg.key.fromMe || false,
        contentType: detectContentType(msg.message),
        body,
        timestamp: new Date((msg.messageTimestamp || Date.now()) * 1000),
        status: normalizeStatus(msg.status),
        contextInfo: msg.message,
        hasMedia: hasMedia(msg.message),
        mediaType: detectMediaType(msg.message),
      }).onConflictDoUpdate({
        target: [messages.threadId, messages.messageId],
        set: {
          status: normalizeStatus(msg.status),
          updatedAt: new Date(),
        },
      });

      // Update thread last message
      await db.update(threads)
        .set({
          lastMessageContent: body,
          lastMessageAt: new Date((msg.messageTimestamp || Date.now()) * 1000),
          unreadCount: msg.key.fromMe ? 0 : (thread.unreadCount || 0) + 1,
          updatedAt: new Date(),
        })
        .where(eq(threads.id, thread.id));

      // Mark as processed
      await markEventProcessed(messageId);

      // Publish to realtime channel
      await redisPub.publish(
        `account:${thread.accountId}:inbox`,
        JSON.stringify({
          type: 'message.new',
          data: {
            threadId: thread.id,
            messageId,
            fromJid: msg.key.fromMe ? 'me' : remoteJid,
            body,
            timestamp: new Date((msg.messageTimestamp || Date.now()) * 1000),
            isFromMe: msg.key.fromMe,
          },
        })
      );

      Logger.info('Message processed successfully', {
        correlationId,
        tenantId,
        messageId,
        threadId: thread.id,
      });
    } catch (error) {
      Logger.error('Error processing message', {
        correlationId,
        messageId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Re-throw to trigger BullMQ retry
    }
  }
}

/**
 * Extract message body from WhatsApp message object
 */
function extractMessageBody(message: any): string {
  if (!message) return '';

  if (message.conversation) return message.conversation;
  if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
  if (message.imageMessage?.caption) return message.imageMessage.caption;
  if (message.videoMessage?.caption) return message.videoMessage.caption;

  return '';
}

/**
 * Detect content type
 */
function detectContentType(message: any): 'text' | 'image' | 'audio' | 'video' | 'document' | 'sticker' | 'location' | 'contact' {
  if (!message) return 'text';

  if (message.imageMessage) return 'image';
  if (message.audioMessage) return 'audio';
  if (message.videoMessage) return 'video';
  if (message.documentMessage) return 'document';
  if (message.stickerMessage) return 'sticker';
  if (message.locationMessage) return 'location';
  if (message.contactMessage) return 'contact';

  return 'text';
}

/**
 * Check if message has media
 */
function hasMedia(message: any): boolean {
  if (!message) return false;

  return !!(
    message.imageMessage ||
    message.audioMessage ||
    message.videoMessage ||
    message.documentMessage ||
    message.stickerMessage
  );
}

/**
 * Detect media type
 */
function detectMediaType(message: any): string | null {
  if (!hasMedia(message)) return null;

  if (message.imageMessage) return 'image';
  if (message.audioMessage) return 'audio';
  if (message.videoMessage) return 'video';
  if (message.documentMessage) return 'document';
  if (message.stickerMessage) return 'sticker';

  return null;
}

/**
 * Normalize status
 */
function normalizeStatus(status?: string): 'pending' | 'sent' | 'delivered' | 'read' | 'error' {
  if (!status) return 'pending';

  const normalized = status.toLowerCase();
  if (['pending', 'sent', 'delivered', 'read', 'error'].includes(normalized)) {
    return normalized as 'pending' | 'sent' | 'delivered' | 'read' | 'error';
  }

  return 'pending';
}

/**
 * Main job processor
 */
async function processWebhookJob(job: Job<WebhookJobData>): Promise<void> {
  const { correlationId, tenantId, provider, eventType, payload } = job.data;

  Logger.info('Processing webhook event', {
    correlationId,
    jobId: job.id,
    tenantId,
    provider,
    eventType,
  });

  // Store raw event for audit
  await db.insert(webhookEventsRaw).values({
    tenantId,
    correlationId,
    eventType,
    provider,
    payload,
    processed: false,
  });

  // Process based on event type
  if (eventType === 'MESSAGES_UPSERT' && payload.data) {
    await processMessagesUpsert(job.data, payload.data);
  } else if (eventType === 'MESSAGES_RECEIVED' && payload.messages) {
    await processMessagesUpsert(job.data, payload.messages);
  } else if (eventType === 'MESSAGES_UPDATE') {
    // Handle message status updates
    Logger.debug('Message update event', { correlationId, eventType });
  } else {
    Logger.debug('Unhandled event type', { correlationId, eventType });
  }

  // Mark raw event as processed
  await db.update(webhookEventsRaw)
    .set({ processed: true })
    .where(eq(webhookEventsRaw.correlationId, correlationId));
}

/**
 * Create and start worker
 */
const worker = new Worker<WebhookJobData>(
  'whatsapp-events',
  async (job) => {
    await processWebhookJob(job);
  },
  {
    connection: bullmqConnection,
    concurrency: 10, // Process 10 jobs concurrently
    limiter: {
      max: 100, // Max 100 jobs
      duration: 1000, // per second
    },
  }
);

worker.on('completed', (job) => {
  Logger.info('Job completed', {
    jobId: job.id,
    correlationId: job.data.correlationId,
  });
});

worker.on('failed', (job, err) => {
  Logger.error('Job failed', {
    jobId: job?.id,
    correlationId: job?.data.correlationId,
    error: err.message,
    stack: err.stack,
  });
});

worker.on('error', (err) => {
  Logger.error('Worker error', { error: err.message });
});

Logger.info('Webhook worker started', { concurrency: 10 });

// Graceful shutdown
process.on('SIGTERM', async () => {
  Logger.info('SIGTERM received, shutting down worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  Logger.info('SIGINT received, shutting down worker...');
  await worker.close();
  process.exit(0);
});
