/**
 * WhatsApp Provider Abstraction
 *
 * Defines interface for different WhatsApp providers (Evolution, Cloud API, Twilio)
 * Allows switching providers without changing business logic
 */

import { z } from 'zod';

// ========================================
// Types & Schemas
// ========================================

export const sendMessageSchema = z.object({
  instanceId: z.string(),
  remoteJid: z.string(),
  message: z.string().min(1).max(4096),
  quotedMessageId: z.string().optional(),
});

export const sendTypingSchema = z.object({
  instanceId: z.string(),
  remoteJid: z.string(),
});

export const syncHistorySchema = z.object({
  instanceId: z.string(),
  remoteJid: z.string(),
  limit: z.number().min(1).max(500).default(200),
});

export const getConversationsSchema = z.object({
  instanceId: z.string(),
  limit: z.number().min(1).max(100).default(50),
});

export type SendMessageParams = z.infer<typeof sendMessageSchema>;
export type SendTypingParams = z.infer<typeof sendTypingSchema>;
export type SyncHistoryParams = z.infer<typeof syncHistorySchema>;
export type GetConversationsParams = z.infer<typeof getConversationsSchema>;

export interface MessageResult {
  messageId: string;
  status: 'pending' | 'sent' | 'error';
  timestamp: Date;
}

export interface HistoryMessage {
  messageId: string;
  remoteJid: string;
  fromJid: string;
  toJid: string;
  body: string;
  timestamp: Date;
  isFromMe: boolean;
  hasMedia: boolean;
  mediaType?: string;
}

export interface Conversation {
  id: string;
  remoteJid: string;
  name: string;
  isGroup: boolean;
  unreadCount: number;
  lastMessageContent?: string;
  lastMessageAt?: Date;
  pictureUrl?: string;
}

// ========================================
// Provider Interface
// ========================================

/**
 * WhatsApp Provider Interface
 *
 * All providers must implement this interface
 */
export interface WhatsAppProvider {
  /**
   * Provider name (evolution, cloud_api, twilio)
   */
  readonly name: string;

  /**
   * Send text message
   */
  sendMessage(params: SendMessageParams): Promise<MessageResult>;

  /**
   * Send typing indicator
   */
  sendTyping(params: SendTypingParams): Promise<void>;

  /**
   * Sync message history
   */
  syncHistory(params: SyncHistoryParams): Promise<HistoryMessage[]>;

  /**
   * Get conversations/chats list
   */
  getConversations(params: GetConversationsParams): Promise<Conversation[]>;

  /**
   * Check health/status of instance
   */
  checkHealth(instanceId: string): Promise<{ connected: boolean; phoneNumber?: string }>;

  /**
   * Disconnect instance
   */
  disconnect(instanceId: string): Promise<void>;
}

// ========================================
// Provider Registry
// ========================================

/**
 * Provider factory
 *
 * Creates provider instance based on type
 */
export function createProvider(type: 'evolution' | 'cloud_api' | 'twilio'): WhatsAppProvider {
  switch (type) {
    case 'evolution':
      // Dynamic import to avoid loading all providers
      const { EvolutionProvider } = require('./evolution-provider');
      return new EvolutionProvider();

    case 'cloud_api':
      const { CloudAPIProvider } = require('./cloud-api-provider');
      return new CloudAPIProvider();

    case 'twilio':
      throw new Error('Twilio provider not implemented yet');

    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
