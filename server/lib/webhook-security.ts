/**
 * Webhook Security Utilities
 *
 * Validates webhook signatures from different providers
 */

import crypto from 'crypto';
import { Logger } from './logger';

/**
 * Verify Evolution API webhook signature
 *
 * @param rawBody - Raw request body as string
 * @param signature - Signature from X-Webhook-Signature header
 * @param secret - Webhook secret configured in Evolution API
 * @returns true if signature is valid
 */
export function verifyEvolutionSignature(
  rawBody: string,
  signature: string | null | undefined,
  secret: string
): boolean {
  if (!signature || !secret) {
    return false;
  }

  try {
    // Compute expected signature
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('hex');

    const expected = `sha256=${expectedSignature}`;

    // Timing-safe comparison
    const expectedBuffer = Buffer.from(expected, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    Logger.error('Error verifying Evolution signature', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Verify Meta Cloud API webhook signature (X-Hub-Signature-256)
 *
 * @param rawBody - Raw request body as string
 * @param signature - Signature from X-Hub-Signature-256 header
 * @param appSecret - App secret from Meta Developer Portal
 * @returns true if signature is valid
 */
export function verifyCloudAPISignature(
  rawBody: string,
  signature: string | null | undefined,
  appSecret: string
): boolean {
  if (!signature || !appSecret) {
    return false;
  }

  if (!signature.startsWith('sha256=')) {
    return false;
  }

  try {
    const expectedSignature = `sha256=${crypto
      .createHmac('sha256', appSecret)
      .update(rawBody, 'utf8')
      .digest('hex')}`;

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const receivedBuffer = Buffer.from(signature, 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch (error) {
    Logger.error('Error verifying Cloud API signature', {
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Verify webhook with IP allowlist (optional additional security)
 *
 * @param requestIp - IP address from request
 * @param allowedIps - Array of allowed IP addresses
 * @returns true if IP is in allowlist
 */
export function verifyIPAllowlist(
  requestIp: string,
  allowedIps: string[]
): boolean {
  if (allowedIps.length === 0) {
    return true; // No IP restriction
  }

  return allowedIps.includes(requestIp);
}

/**
 * Generate webhook secret (for setup)
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString('hex');
}
