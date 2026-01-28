/**
 * Correlation ID Middleware
 *
 * Adds a unique correlation ID to each request for distributed tracing
 */

import type { Request, RequestHandler } from 'express';
import { randomUUID } from 'crypto';

export type CorrelatedRequest = Request & { correlationId: string };

/**
 * Middleware: Add correlation ID to request
 *
 * - Uses existing X-Correlation-Id header if present
 * - Generates new UUID if not present
 * - Adds correlation ID to response headers
 */
export const addCorrelationId: RequestHandler = (req, res, next) => {
  const headerValue = req.header('x-correlation-id');
  const correlationId = headerValue && headerValue.trim().length > 0 ? headerValue : randomUUID();

  (req as CorrelatedRequest).correlationId = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);

  next();
};
