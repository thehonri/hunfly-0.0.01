/**
 * Structured Logger with PII Redaction
 *
 * Winston-based logger that automatically redacts sensitive information
 */

import winston from 'winston';

/**
 * Redact PII from log messages
 */
const redactPII = winston.format((info) => {
  // Create a copy to avoid mutating original
  const sanitized = { ...info };

  // Redact phone numbers (keep last 4 digits)
  if (sanitized.phone) {
    sanitized.phone = String(sanitized.phone).replace(/\d(?=\d{4})/g, '*');
  }
  if (sanitized.phoneNumber) {
    sanitized.phoneNumber = String(sanitized.phoneNumber).replace(/\d(?=\d{4})/g, '*');
  }
  if (sanitized.contactPhone) {
    sanitized.contactPhone = String(sanitized.contactPhone).replace(/\d(?=\d{4})/g, '*');
  }

  // Redact email addresses (keep first 2 chars + domain)
  if (sanitized.email) {
    sanitized.email = String(sanitized.email).replace(/(.{2}).*(@.*)/, '$1***$2');
  }

  // Redact message content completely
  if (sanitized.messageContent) {
    sanitized.messageContent = '[REDACTED]';
  }
  if (sanitized.body) {
    sanitized.body = '[REDACTED]';
  }

  // Redact tokens and secrets
  const secretFields = ['token', 'apiKey', 'secret', 'password', 'authorization'];
  for (const field of secretFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }

  // Redact authorization header
  if (sanitized.headers?.authorization) {
    sanitized.headers.authorization = '[REDACTED]';
  }

  return sanitized;
});

/**
 * Add timestamp and format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  redactPII(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Console format for development (colorized, pretty)
 */
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.colorize(),
  redactPII(),
  winston.format.printf((info) => {
    const { timestamp, level, message, correlationId, ...meta } = info;
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    const corrId = correlationId ? `[${correlationId.slice(0, 8)}]` : '';
    return `${timestamp} ${level} ${corrId} ${message} ${metaStr}`;
  })
);

/**
 * Create logger instance
 */
export const Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: logFormat,
  transports: [
    // Console (development-friendly format)
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
    }),

    // Error log file
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    // Combined log file
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
});

/**
 * Helper: Log with correlation ID
 */
export function logWithContext(
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  context: Record<string, any>
) {
  Logger.log(level, message, context);
}
