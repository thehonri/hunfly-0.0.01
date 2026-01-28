/**
 * Metrics Middleware
 *
 * Collects HTTP metrics for Prometheus
 */

import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpRequestDuration } from '../lib/metrics';

/**
 * Normalize route path for metrics
 * Replaces dynamic segments with placeholders
 */
function normalizeRoute(path: string): string {
  // Replace UUIDs with :id
  return path.replace(
    /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    '/:id'
  );
}

/**
 * Middleware: Collect HTTP metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = process.hrtime();

  // Capture response finish
  res.on('finish', () => {
    const duration = process.hrtime(startTime);
    const durationSeconds = duration[0] + duration[1] / 1e9;

    const route = normalizeRoute(req.path);
    const method = req.method;
    const statusCode = res.statusCode.toString();

    // Increment request counter
    httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });

    // Record request duration
    httpRequestDuration.observe(
      {
        method,
        route,
        status_code: statusCode,
      },
      durationSeconds
    );
  });

  next();
}
