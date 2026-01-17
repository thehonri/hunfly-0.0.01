import pkg from "whatsapp-web.js";
const { Client, LocalAuth, Events } = pkg;
import type { Client as ClientType, Message } from "whatsapp-web.js";
import qrcode from "qrcode";
import { EventEmitter } from "events";
import path from "path";
import { fileURLToPath } from "url";
import { Logger } from "./logger";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface ChatData {
  id: string;
  name: string;
  isGroup: boolean;
  timestamp: number;
  unreadCount: number;
}

export interface MessageData {
  id: string;
  chatId: string;
  from: string;
  to: string;
  body: string;
  timestamp: number;
  isFromMe: boolean;
  hasMedia: boolean;
  mediaType?: string;
  mediaUrl?: string;
}

export class WhatsAppManager extends EventEmitter {
  public client: ClientType | null = null;
  private qrCode: string = "";
  private isConnected: boolean = false;
  private isReady: boolean = false;
  private isInitializing: boolean = false;

  constructor() {
    super();
    // Não inicializa automaticamente no construtor para dar controle ao server
  }

  private initializeClient() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "ascend-sales-engine",
        dataPath: process.env.WHATSAPP_SESSION_DIR || ".wwebjs_auth",
      }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.client) return;

    // QR Code event
    this.client.on(Events.QR_RECEIVED, async (qr: string) => {
      try {
        this.qrCode = await qrcode.toDataURL(qr);
        this.isReady = false;
        this.isInitializing = false;
        Logger.info("[WhatsAppManager] QR Code received");
        this.emit("qr", this.qrCode);
      } catch (error) {
        Logger.error(`[WhatsAppManager] Error generating QR code: ${error}`);
      }
    });

    // Ready event
    this.client.on(Events.READY, () => {
      Logger.info("[WhatsAppManager] Client is ready!");
      this.isReady = true;
      this.isConnected = true;
      this.isInitializing = false;
      this.qrCode = "";
      this.emit("ready");
    });

    // Authenticated event
    this.client.on(Events.AUTHENTICATED, () => {
      Logger.info("[WhatsAppManager] Authenticated!");
      this.isConnected = true;
      this.emit("authenticated");
    });

    // Auth failure event
    this.client.on("auth_failure", (msg: string) => {
      Logger.error(`[WhatsAppManager] Auth failure: ${msg}`);
      this.isReady = false;
      this.isInitializing = false;
      this.emit("auth_failure", msg);
    });

    // Disconnected event
    this.client.on(Events.DISCONNECTED, (reason: string) => {
      Logger.warn(`[WhatsAppManager] Disconnected: ${reason}`);
      this.isReady = false;
      this.isConnected = false;
      this.isInitializing = false;
      this.emit("disconnected", reason);
    });

    // Message event
    this.client.on(Events.MESSAGE_RECEIVED, (message: Message) => {
      Logger.info(`[WhatsAppManager] Message received from ${message.from}`);
      this.emit("message", message);
    });
  }

  async initialize(): Promise<void> {
    if (this.isReady) {
      Logger.info("[WhatsAppManager] Already initialized");
      return;
    }

    if (this.isInitializing) {
      Logger.info("[WhatsAppManager] Already initializing...");
      return;
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      this.isInitializing = true;
      Logger.info("[WhatsAppManager] Initializing client...");
      await this.client!.initialize();
    } catch (error) {
      this.isInitializing = false;
      Logger.error(`[WhatsAppManager] Error initializing: ${error}`);
      throw error;
    }
  }

  async destroy(): Promise<void> {
    if (!this.client) return;

    try {
      Logger.info("[WhatsAppManager] Destroying client...");
      await this.client.destroy();
      this.isReady = false;
      this.isConnected = false;
      this.isInitializing = false;
      this.qrCode = "";
      // Não anulamos o client aqui para permitir re-init se necessário,
      // mas na prática library pode exigir nova instância.
      // Vamos recriar no próximo initialize se necessário.
      this.client = null;
      this.emit("disconnected");
    } catch (error) {
      Logger.error(`[WhatsAppManager] Error destroying: ${error}`);
      throw error;
    }
  }

  getStatus() {
    return {
      connected: this.isReady,
      initializing: this.isInitializing,
      qr: this.qrCode || null,
    };
  }

  async sendMessage(chatId: string, message: string): Promise<any> {
    if (!this.client || !this.isReady) {
      throw new Error("WhatsApp not ready");
    }
    return this.client.sendMessage(chatId, message);
  }
}

// Singleton instance
export const whatsappManager = new WhatsAppManager();
