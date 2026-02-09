/**
 * Evolution API Provider Implementation
 */

import {
  WhatsAppProvider,
  SendMessageParams,
  SendTypingParams,
  SyncHistoryParams,
  GetConversationsParams,
  MessageResult,
  HistoryMessage,
  Conversation,
  sendMessageSchema,
  sendTypingSchema,
  syncHistorySchema,
  getConversationsSchema,
} from './whatsapp';
import { Logger } from '../lib/logger';

// Lazy initialization - don't fail at module load time
function getEvolutionConfig() {
  const url = process.env.EVOLUTION_API_URL;
  const key = process.env.EVOLUTION_API_KEY;

  if (!url) {
    throw new Error('EVOLUTION_API_URL is required in environment');
  }

  return { url, key };
}

/**
 * Evolution API Provider
 */
export class EvolutionProvider implements WhatsAppProvider {
  readonly name = 'evolution';

  private headers: Record<string, string>;
  private apiUrl: string;

  constructor() {
    const config = getEvolutionConfig();
    this.apiUrl = config.url;
    this.headers = {
      'Content-Type': 'application/json',
      ...(config.key ? { apiKey: config.key } : {}),
    };
  }

  /**
   * Make HTTP request to Evolution API
   */
  private async request<T>(
    path: string,
    body?: unknown,
    method: 'GET' | 'POST' | 'DELETE' = 'POST'
  ): Promise<T> {
    const url = `${this.apiUrl}${path}`;

    try {
      const response = await fetch(url, {
        method,
        headers: this.headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Evolution API error ${response.status}: ${text}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      Logger.error('Evolution API request failed', {
        url,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Send text message
   */
  async sendMessage(params: SendMessageParams): Promise<MessageResult> {
    const validated = sendMessageSchema.parse(params);

    const response = await this.request<any>('/message/sendText', {
      instanceId: validated.instanceId,
      remoteJid: validated.remoteJid,
      message: validated.message,
      quoted: validated.quotedMessageId
        ? { messageId: validated.quotedMessageId }
        : undefined,
    });

    return {
      messageId: response.key?.id || response.messageId || 'unknown',
      status: 'pending',
      timestamp: new Date(),
    };
  }

  /**
   * Send typing indicator
   */
  async sendTyping(params: SendTypingParams): Promise<void> {
    const validated = sendTypingSchema.parse(params);

    await this.request('/message/sendPresence', {
      instanceId: validated.instanceId,
      remoteJid: validated.remoteJid,
      presence: 'composing',
    });
  }

  /**
   * Sync message history
   */
  async syncHistory(params: SyncHistoryParams): Promise<HistoryMessage[]> {
    const validated = syncHistorySchema.parse(params);

    const response = await this.request<any>('/message/fetchHistory', {
      instanceId: validated.instanceId,
      remoteJid: validated.remoteJid,
      limit: validated.limit,
    });

    // Transform Evolution response to standard format
    const messages = Array.isArray(response) ? response : response.messages || [];

    return messages.map((msg: any) => ({
      messageId: msg.key?.id || msg.id,
      remoteJid: msg.key?.remoteJid || msg.remoteJid,
      fromJid: msg.key?.fromMe ? validated.instanceId : msg.key?.remoteJid,
      toJid: msg.key?.fromMe ? msg.key?.remoteJid : validated.instanceId,
      body: this.extractMessageBody(msg),
      timestamp: new Date((msg.messageTimestamp || msg.timestamp || Date.now()) * 1000),
      isFromMe: msg.key?.fromMe || false,
      hasMedia: !!msg.message?.imageMessage || !!msg.message?.audioMessage,
      mediaType: this.detectMediaType(msg),
    }));
  }

  /**
   * Get conversations list
   */
  async getConversations(params: GetConversationsParams): Promise<Conversation[]> {
    const validated = getConversationsSchema.parse(params);

    const response = await this.request<any>('/chat/list', {
      instanceId: validated.instanceId,
      limit: validated.limit,
    });

    const chats = Array.isArray(response) ? response : response.chats || [];

    return chats.map((chat: any) => ({
      id: chat.id,
      remoteJid: chat.id,
      name: chat.name || chat.pushName || chat.id,
      isGroup: chat.isGroup || false,
      unreadCount: chat.unreadCount || 0,
      lastMessageContent: this.extractMessageBody(chat.lastMessage),
      lastMessageAt: chat.lastMessageTimestamp
        ? new Date(chat.lastMessageTimestamp * 1000)
        : undefined,
      pictureUrl: chat.profilePictureUrl,
    }));
  }

  /**
   * Check instance health
   */
  async checkHealth(instanceId: string): Promise<{ connected: boolean; phoneNumber?: string }> {
    try {
      const response = await this.request<any>(`/instance/connectionState/${instanceId}`, undefined, 'GET');

      return {
        connected: response.state === 'open' || response.status === 'connected',
        phoneNumber: response.phoneNumber,
      };
    } catch (error) {
      Logger.error('Failed to check Evolution instance health', {
        instanceId,
        error: error instanceof Error ? error.message : String(error),
      });
      return { connected: false };
    }
  }

  /**
   * Disconnect instance
   */
  async disconnect(instanceId: string): Promise<void> {
    await this.request(`/instance/logout/${instanceId}`, undefined, 'DELETE');
  }

  /**
   * Helper: Extract message body from Evolution message object
   */
  private extractMessageBody(msg: any): string {
    if (!msg || !msg.message) return '';

    const message = msg.message;

    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    if (message.imageMessage?.caption) return message.imageMessage.caption;
    if (message.videoMessage?.caption) return message.videoMessage.caption;

    return '';
  }

  /**
   * Helper: Detect media type from message
   */
  private detectMediaType(msg: any): string | undefined {
    if (!msg || !msg.message) return undefined;

    const message = msg.message;

    if (message.imageMessage) return 'image';
    if (message.audioMessage) return 'audio';
    if (message.videoMessage) return 'video';
    if (message.documentMessage) return 'document';
    if (message.stickerMessage) return 'sticker';
    if (message.locationMessage) return 'location';
    if (message.contactMessage) return 'contact';

    return undefined;
  }
}
