/**
 * Redis Configuration
 *
 * Centralized Redis connection management for:
 * - BullMQ queues
 * - Pub/Sub (realtime events)
 * - Caching
 * - Idempotency tracking
 * - Rate limiting
 */

import Redis from 'ioredis';
import { Logger } from './logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
const REDIS_TLS = process.env.REDIS_TLS === 'true';

/**
 * Parse Redis URL to connection options
 */
function parseRedisUrl(url: string): any {
  try {
    const parsedUrl = new URL(url);
    return {
      host: parsedUrl.hostname,
      port: parseInt(parsedUrl.port) || 6379,
      password: parsedUrl.password || REDIS_PASSWORD,
      db: parseInt(parsedUrl.pathname.slice(1)) || 0,
      ...(REDIS_TLS ? {
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      } : {}),
    };
  } catch {
    // Fallback for simple host:port format
    return {
      host: 'localhost',
      port: 6379,
      password: REDIS_PASSWORD,
    };
  }
}

const redisOptions = {
  ...parseRedisUrl(REDIS_URL),
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      // Reconnect on READONLY errors (failover)
      return true;
    }
    return false;
  },
};

/**
 * Main Redis client (for cache, idempotency, etc.)
 */
export const redis = new Redis(redisOptions);

redis.on('connect', () => {
  Logger.info('Redis connected');
});

redis.on('error', (err) => {
  Logger.error('Redis error', { error: err.message });
});

redis.on('close', () => {
  Logger.warn('Redis connection closed');
});

/**
 * Redis client for Pub/Sub (subscriber)
 * Separate client because subscribers can't run other commands
 */
export const redisSub = new Redis(redisOptions);

redisSub.on('connect', () => {
  Logger.info('Redis subscriber connected');
});

redisSub.on('error', (err) => {
  Logger.error('Redis subscriber error', { error: err.message });
});

/**
 * Redis client for Pub/Sub (publisher)
 */
export const redisPub = new Redis(redisOptions);

redisPub.on('connect', () => {
  Logger.info('Redis publisher connected');
});

redisPub.on('error', (err) => {
  Logger.error('Redis publisher error', { error: err.message });
});

/**
 * Redis connection config for BullMQ
 * BullMQ creates its own connections internally
 */
export const bullmqConnection = redisOptions;

/**
 * Graceful shutdown
 */
export async function disconnectRedis() {
  Logger.info('Disconnecting Redis clients...');
  await Promise.all([
    redis.quit(),
    redisSub.quit(),
    redisPub.quit(),
  ]);
  Logger.info('Redis clients disconnected');
}

// Handle process termination
process.on('SIGTERM', disconnectRedis);
process.on('SIGINT', disconnectRedis);
