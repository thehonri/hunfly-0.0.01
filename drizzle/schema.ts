import {
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
  boolean,
  jsonb,
  integer,
  uuid,
} from "drizzle-orm/pg-core";

export const whatsappSessions = pgTable("whatsapp_sessions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(), // Supabase Auth ID (UUID)
  phoneNumber: varchar("phone_number", { length: 20 }),
  isConnected: boolean("is_connected").default(false),
  isReady: boolean("is_ready").default(false),
  lastConnectedAt: timestamp("last_connected_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const whatsappMessages = pgTable("whatsapp_messages", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  messageId: varchar("message_id", { length: 255 }).unique(),
  chatId: varchar("chat_id", { length: 255 }).notNull(),
  from: varchar("from", { length: 255 }).notNull(),
  to: varchar("to", { length: 255 }).notNull(),
  body: text("body"),
  timestamp: timestamp("timestamp"),
  isFromMe: boolean("is_from_me").default(false),
  hasMedia: boolean("has_media").default(false),
  mediaType: varchar("media_type", { length: 50 }),
  mediaUrl: varchar("media_url", { length: 500 }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const whatsappChats = pgTable("whatsapp_chats", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  chatId: varchar("chat_id", { length: 255 }).unique(),
  name: varchar("name", { length: 255 }).notNull(),
  isGroup: boolean("is_group").default(false),
  unreadCount: integer("unread_count").default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const whatsappMedia = pgTable("whatsapp_media", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  messageId: varchar("message_id", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size"),
  s3Key: varchar("s3_key", { length: 500 }).notNull(),
  s3Url: varchar("s3_url", { length: 500 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const suggestedResponses = pgTable("suggested_responses", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  messageId: varchar("message_id", { length: 255 }).notNull(),
  suggestions: jsonb("suggestions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type WhatsAppSession = typeof whatsappSessions.$inferSelect;
export type WhatsAppMessage = typeof whatsappMessages.$inferSelect;
export type WhatsAppChat = typeof whatsappChats.$inferSelect;
export type WhatsAppMedia = typeof whatsappMedia.$inferSelect;
export type SuggestedResponse = typeof suggestedResponses.$inferSelect;
