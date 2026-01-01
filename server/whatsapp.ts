import { Client, LocalAuth, Events, Message } from "whatsapp-web.js";
import qrcode from "qrcode";
import { EventEmitter } from "events";
import path from "path";
import { fileURLToPath } from "url";

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
  private client: Client | null = null;
  private qrCode: string = "";
  private isConnected: boolean = false;
  private isReady: boolean = false;

  constructor() {
    super();
    this.initializeClient();
  }

  private initializeClient() {
    this.client = new Client({
      authStrategy: new LocalAuth({
        clientId: "ascend-sales-engine",
        dataPath: path.join(__dirname, "..", ".wwebjs_auth"),
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
      console.log("QR Code received");
      try {
        this.qrCode = await qrcode.toDataURL(qr);
        this.emit("qr", this.qrCode);
      } catch (error) {
        console.error("Error generating QR code:", error);
      }
    });

    // Ready event
    this.client.on(Events.READY, () => {
      console.log("WhatsApp client is ready!");
      this.isReady = true;
      this.isConnected = true;
      this.qrCode = "";
      this.emit("authenticated");
    });

    // Authenticated event
    this.client.on(Events.AUTHENTICATED, () => {
      console.log("WhatsApp authenticated!");
      this.isConnected = true;
    });

    // Auth failure event
    this.client.on(Events.AUTH_FAILURE, (msg: string) => {
      console.error("Authentication failure:", msg);
      this.emit("error", new Error(`Authentication failed: ${msg}`));
    });

    // Disconnected event
    this.client.on(Events.DISCONNECTED, (reason: string) => {
      console.log("WhatsApp disconnected:", reason);
      this.isReady = false;
      this.isConnected = false;
      this.emit("disconnected");
    });

    // Message event
    this.client.on(Events.MESSAGE_RECEIVED, (message: Message) => {
      console.log("Message received:", message.body);
      this.emit("message", message);
    });

    // Message acknowledge event
    this.client.on(Events.MESSAGE_ACK, (message: Message, ack: string) => {
      console.log("Message ACK:", ack);
      this.emit("message_ack", message, ack);
    });

    // Error event
    this.client.on(Events.ERROR, (error: Error) => {
      console.error("WhatsApp error:", error);
      this.emit("error", error);
    });
  }

  async initialize(): Promise<void> {
    if (this.isReady) {
      console.log("WhatsApp already initialized");
      return;
    }

    if (!this.client) {
      this.initializeClient();
    }

    try {
      console.log("Initializing WhatsApp client...");
      await this.client!.initialize();
    } catch (error) {
      console.error("Error initializing WhatsApp:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.client) return;

    try {
      console.log("Disconnecting WhatsApp client...");
      await this.client.destroy();
      this.isReady = false;
      this.isConnected = false;
      this.qrCode = "";
      this.client = null;
      this.emit("disconnected");
    } catch (error) {
      console.error("Error disconnecting WhatsApp:", error);
      throw error;
    }
  }

  getQRCode(): { qr: string; isConnected: boolean; isReady: boolean } {
    return {
      qr: this.qrCode,
      isConnected: this.isConnected,
      isReady: this.isReady,
    };
  }

  isConnectedStatus(): boolean {
    return this.isConnected;
  }

  isReadyStatus(): boolean {
    return this.isReady;
  }

  async getChats(): Promise<ChatData[]> {
    if (!this.client || !this.isReady) {
      throw new Error("WhatsApp not ready");
    }

    try {
      const chats = await this.client.getChats();
      return chats.map((chat) => ({
        id: chat.id._serialized,
        name: chat.name || chat.id.user || "Unknown",
        isGroup: chat.isGroup,
        timestamp: chat.timestamp * 1000,
        unreadCount: chat.unreadCount,
      }));
    } catch (error) {
      console.error("Error getting chats:", error);
      throw error;
    }
  }

  async getMessages(chatId: string, limit: number = 50): Promise<MessageData[]> {
    if (!this.client || !this.isReady) {
      throw new Error("WhatsApp not ready");
    }

    try {
      const chat = await this.client.getChatById(chatId);
      const messages = await chat.fetchMessages({ limit });

      return messages.map((msg) => ({
        id: msg.id._serialized,
        chatId: msg.from,
        from: msg.from,
        to: msg.to,
        body: msg.body,
        timestamp: msg.timestamp * 1000,
        isFromMe: msg.fromMe,
        hasMedia: msg.hasMedia,
        mediaType: msg.type,
        mediaUrl: msg.hasMedia ? msg.downloadUrl : undefined,
      }));
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  async sendMessage(chatId: string, message: string): Promise<boolean> {
    if (!this.client || !this.isReady) {
      throw new Error("WhatsApp not ready");
    }

    try {
      await this.client.sendMessage(chatId, message);
      console.log("Message sent successfully");
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  // Compatibility methods
  isConnected(): boolean {
    return this.isConnected;
  }

  isReady(): boolean {
    return this.isReady;
  }

  onConnectionChange(callback: (status: { isReady: boolean; isConnected: boolean }) => void): void {
    this.on("authenticated", () => {
      callback({ isReady: this.isReady, isConnected: this.isConnected });
    });
    this.on("disconnected", () => {
      callback({ isReady: this.isReady, isConnected: this.isConnected });
    });
  }
}
