/**
 * Correlation ID Middleware
 *
 * Adds a unique correlation ID to each request for distributed tracing
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export interface CorrelatedRequest extends Request {
  correlationId: string;
}

/**
 * Middleware: Add correlation ID to request
 *
 * - Uses existing X-Correlation-Id header if present
 * - Generates new UUID if not present
 * - Adds correlation ID to response headers
 */
export function addCorrelationId(
  req: CorrelatedRequest,
  res: Response,
  next: NextFunction
) {
  // Use existing correlation ID or generate new one
  const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();

  req.correlationId = correlationId;

  // Add to response headers for client tracking
  res.setHeader('X-Correlation-Id', correlationId);

  next();
}
