/**
 * LEGACY WhatsApp integration (whatsapp-web.js)
 *
 * Regra do produto (Hunfly): WhatsApp deve ser integrado via WhatsApp Business API
 * (Cloud API / BSP). Este módulo existe apenas para compatibilidade temporária.
 *
 * Em produção: mantenha LEGACY_WWEBJS_ENABLED=false.
 */

import { Logger } from "./lib/logger";
import { EventEmitter } from "events";

export interface WhatsAppLegacyStatus {
  connected: boolean;
  initializing: boolean;
  qr: string;
}

export class WhatsAppManager extends EventEmitter {
  constructor() {
    super();
  }

  async initialize(): Promise<void> {
    if (process.env.LEGACY_WWEBJS_ENABLED === "true") {
      // Não implementamos aqui de propósito: legado é proibido por padrão.
      Logger.warn("Legacy WhatsApp requested but not implemented in this build");
    }
  }

  async destroy(): Promise<void> {
    // no-op
  }

  getStatus(): WhatsAppLegacyStatus {
    return {
      connected: false,
      initializing: false,
      qr: '',
    };
  }

  async sendMessage(
    _chatId: string,
    _message: string
  ): Promise<{ id?: { id?: string } } | null> {
    throw new Error("Legacy WhatsApp is disabled");
  }
}

export const whatsappManager = new WhatsAppManager();




