/**
 * Tenant Resolution
 *
 * Maps WhatsApp instanceId or phoneNumberId to tenantId
 */

import { db } from '../db';
import { whatsappAccounts } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { Logger } from './logger';

export type AccountResolution = {
  tenantId: string;
  accountId: string;
  ownerMemberId: string;
};

/**
 * Get tenantId from Evolution API instanceId
 *
 * @param instanceId - Evolution API instance ID
 * @returns tenantId or null if not found
 */
export async function getTenantIdFromInstanceId(
  instanceId: string
): Promise<string | null> {
  if (!instanceId) {
    return null;
  }

  try {
    const account = await db.query.whatsappAccounts.findFirst({
      where: eq(whatsappAccounts.instanceId, instanceId),
    });

    if (!account) {
      Logger.warn('WhatsApp account not found for instanceId', { instanceId });
      return null;
    }

    return account.tenantId;
  } catch (error) {
    Logger.error('Error resolving tenantId from instanceId', {
      instanceId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Resolve account metadata from Evolution instanceId
 */
export async function getAccountFromInstanceId(
  instanceId: string
): Promise<AccountResolution | null> {
  if (!instanceId) {
    return null;
  }

  try {
    const account = await db.query.whatsappAccounts.findFirst({
      where: eq(whatsappAccounts.instanceId, instanceId),
    });

    if (!account) {
      Logger.warn('WhatsApp account not found for instanceId', { instanceId });
      return null;
    }

    return {
      tenantId: account.tenantId,
      accountId: account.id,
      ownerMemberId: account.ownerMemberId,
    };
  } catch (error) {
    Logger.error('Error resolving account from instanceId', {
      instanceId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Get tenantId from Cloud API phone number ID
 *
 * @param phoneNumberId - Meta Cloud API phone number ID
 * @returns tenantId or null if not found
 */
export async function getTenantIdFromPhoneNumberId(
  phoneNumberId: string
): Promise<string | null> {
  if (!phoneNumberId) {
    return null;
  }

  try {
    const account = await db.query.whatsappAccounts.findFirst({
      where: eq(whatsappAccounts.instanceId, phoneNumberId),
    });

    if (!account) {
      Logger.warn('WhatsApp account not found for phoneNumberId', { phoneNumberId });
      return null;
    }

    return account.tenantId;
  } catch (error) {
    Logger.error('Error resolving tenantId from phoneNumberId', {
      phoneNumberId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Resolve account metadata from Cloud API phone number id
 */
export async function getAccountFromPhoneNumberId(
  phoneNumberId: string
): Promise<AccountResolution | null> {
  if (!phoneNumberId) {
    return null;
  }

  try {
    const account = await db.query.whatsappAccounts.findFirst({
      where: eq(whatsappAccounts.instanceId, phoneNumberId),
    });

    if (!account) {
      Logger.warn('WhatsApp account not found for phoneNumberId', { phoneNumberId });
      return null;
    }

    return {
      tenantId: account.tenantId,
      accountId: account.id,
      ownerMemberId: account.ownerMemberId,
    };
  } catch (error) {
    Logger.error('Error resolving account from phoneNumberId', {
      phoneNumberId,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
