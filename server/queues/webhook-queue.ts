/**
 * Webhook Event Queue
 *
 * BullMQ queue for async processing of webhook events
 */

import { Queue } from 'bullmq';
import { bullmqConnection } from '../lib/redis';
import { Logger } from '../lib/logger';

/**
 * Webhook event job data
 */
export interface WebhookJobData {
  correlationId: string;
  tenantId: string | null;
  accountId?: string | null;
  provider: 'evolution' | 'cloud_api';
  eventType: string;
  payload: any;
  receivedAt: Date;
}

/**
 * Webhook events queue
 */
export const webhookQueue = new Queue<WebhookJobData>('whatsapp-events', {
  connection: bullmqConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24h
      count: 1000,
    },
    removeOnFail: {
      age: 604800, // Keep failed jobs for 7 days
      count: 5000,
    },
  },
});

webhookQueue.on('error', (err) => {
  Logger.error('Webhook queue error', { error: err.message });
});

/**
 * Add webhook event to queue
 */
export async function enqueueWebhookEvent(data: WebhookJobData): Promise<string> {
  const job = await webhookQueue.add('process-webhook', data, {
    jobId: data.correlationId, // Use correlation ID as job ID for idempotency
  });

  Logger.debug('Webhook event enqueued', {
    correlationId: data.correlationId,
    jobId: job.id,
    provider: data.provider,
    eventType: data.eventType,
  });

  return job.id || data.correlationId;
}

/**
 * Get queue metrics
 */
export async function getQueueMetrics() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    webhookQueue.getWaitingCount(),
    webhookQueue.getActiveCount(),
    webhookQueue.getCompletedCount(),
    webhookQueue.getFailedCount(),
    webhookQueue.getDelayedCount(),
  ]);

  return {
    waiting,
    active,
    completed,
    failed,
    delayed,
    backlog: waiting + delayed,
  };
}
