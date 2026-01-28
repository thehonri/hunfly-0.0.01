/**
 * Prometheus Metrics
 *
 * Application metrics for monitoring and alerting
 */

import { Counter, Histogram, Gauge, register, collectDefaultMetrics } from 'prom-client';

// Enable default metrics (CPU, memory, etc.)
collectDefaultMetrics({
  prefix: 'hunfly_',
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ========================================
// HTTP Metrics
// ========================================

export const httpRequestsTotal = new Counter({
  name: 'hunfly_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
  name: 'hunfly_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

// ========================================
// WhatsApp Inbox Metrics
// ========================================

export const messagesReceivedTotal = new Counter({
  name: 'hunfly_inbox_messages_received_total',
  help: 'Total number of messages received',
  labelNames: ['tenant_id', 'provider', 'content_type'],
});

export const messagesSentTotal = new Counter({
  name: 'hunfly_inbox_messages_sent_total',
  help: 'Total number of messages sent',
  labelNames: ['tenant_id', 'provider', 'status'],
});

export const messageProcessingDuration = new Histogram({
  name: 'hunfly_inbox_message_processing_duration_seconds',
  help: 'Time from webhook received to DB inserted',
  labelNames: ['tenant_id', 'provider'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
});

export const activeThreads = new Gauge({
  name: 'hunfly_inbox_active_threads',
  help: 'Number of active (open/pending) threads',
  labelNames: ['tenant_id', 'status'],
});

// ========================================
// Queue Metrics
// ========================================

export const queueBacklog = new Gauge({
  name: 'hunfly_queue_backlog',
  help: 'Number of jobs waiting in queue',
  labelNames: ['queue_name'],
});

export const queueActiveJobs = new Gauge({
  name: 'hunfly_queue_active_jobs',
  help: 'Number of jobs currently being processed',
  labelNames: ['queue_name'],
});

export const queueCompletedTotal = new Counter({
  name: 'hunfly_queue_completed_total',
  help: 'Total number of completed jobs',
  labelNames: ['queue_name'],
});

export const queueFailedTotal = new Counter({
  name: 'hunfly_queue_failed_total',
  help: 'Total number of failed jobs',
  labelNames: ['queue_name'],
});

export const queueProcessingDuration = new Histogram({
  name: 'hunfly_queue_processing_duration_seconds',
  help: 'Job processing duration',
  labelNames: ['queue_name'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

// ========================================
// Provider Metrics
// ========================================

export const providerRequestsTotal = new Counter({
  name: 'hunfly_provider_requests_total',
  help: 'Total requests to WhatsApp provider API',
  labelNames: ['provider', 'operation', 'status'],
});

export const providerRequestDuration = new Histogram({
  name: 'hunfly_provider_request_duration_seconds',
  help: 'Provider API request duration',
  labelNames: ['provider', 'operation'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

export const providerErrors = new Counter({
  name: 'hunfly_provider_errors_total',
  help: 'Total provider API errors',
  labelNames: ['provider', 'operation', 'error_type'],
});

// ========================================
// Realtime Metrics
// ========================================

export const realtimeConnections = new Gauge({
  name: 'hunfly_realtime_connections',
  help: 'Number of active realtime connections',
  labelNames: ['tenant_id', 'type'], // type: sse, ws
});

export const realtimeEventsPublished = new Counter({
  name: 'hunfly_realtime_events_published_total',
  help: 'Total realtime events published',
  labelNames: ['tenant_id', 'event_type'],
});

// ========================================
// Database Metrics
// ========================================

export const dbQueryDuration = new Histogram({
  name: 'hunfly_db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

export const dbConnectionPoolSize = new Gauge({
  name: 'hunfly_db_connection_pool_size',
  help: 'Database connection pool size',
  labelNames: ['state'], // state: idle, active
});

// ========================================
// Export Registry
// ========================================

/**
 * Get metrics for Prometheus scraping
 */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/**
 * Reset all metrics (for testing)
 */
export function resetMetrics() {
  register.resetMetrics();
}
