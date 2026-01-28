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
  pgEnum,
  unique,
  index,
} from "drizzle-orm/pg-core";

// ========================================
// ENUMS
// ========================================

export const tenantStatus = pgEnum("tenant_status", [
  "active",
  "suspended",
  "deleted",
]);

export const tenantPlan = pgEnum("tenant_plan", [
  "starter",
  "pro",
  "enterprise",
]);

export const memberRole = pgEnum("member_role", [
  "super_admin",
  "tenant_admin",
  "manager",
  "agent",
]);

export const memberStatus = pgEnum("member_status", ["active", "inactive"]);

export const whatsappProvider = pgEnum("whatsapp_provider", [
  "evolution",
  "cloud_api",
  "twilio",
]);

export const whatsappAccountStatus = pgEnum("whatsapp_account_status", [
  "connected",
  "disconnected",
  "error",
]);

export const threadStatus = pgEnum("thread_status", [
  "open",
  "pending",
  "resolved",
  "closed",
]);

export const whatsappMessageStatus = pgEnum("whatsapp_message_status", [
  "pending",
  "sent",
  "delivered",
  "read",
  "error",
]);

export const messageContentType = pgEnum("message_content_type", [
  "text",
  "image",
  "audio",
  "video",
  "document",
  "location",
  "contact",
  "sticker",
]);

// ========================================
// TENANTS & MEMBERS
// ========================================

export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  status: tenantStatus("status").default("active").notNull(),
  plan: tenantPlan("plan").default("starter").notNull(),
  maxSeats: integer("max_seats").default(5).notNull(),
  maxWhatsappAccounts: integer("max_whatsapp_accounts").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  slugIdx: index("idx_tenants_slug").on(table.slug),
  statusIdx: index("idx_tenants_status").on(table.status),
}));

export const tenantMembers = pgTable("tenant_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull(), // Supabase Auth ID
  role: memberRole("role").notNull(),
  status: memberStatus("status").default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantUserUnique: unique("tenant_members_tenant_user_unique").on(table.tenantId, table.userId),
  tenantIdx: index("idx_tenant_members_tenant").on(table.tenantId),
  userIdx: index("idx_tenant_members_user").on(table.userId),
  roleIdx: index("idx_tenant_members_role").on(table.role),
}));

// ========================================
// WHATSAPP ACCOUNTS (Instâncias/Números)
// ========================================

export const whatsappAccounts = pgTable("whatsapp_accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  ownerMemberId: uuid("owner_member_id").notNull().references(() => tenantMembers.id, { onDelete: "cascade" }),
  instanceId: varchar("instance_id", { length: 255 }).notNull(),
  provider: whatsappProvider("provider").notNull(),
  phoneNumber: varchar("phone_number", { length: 20 }),
  displayName: varchar("display_name", { length: 255 }),
  status: whatsappAccountStatus("status").default("disconnected").notNull(),
  lastConnectedAt: timestamp("last_connected_at"),
  webhookUrl: text("webhook_url"),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  providerInstanceUnique: unique("wa_accounts_provider_instance_unique").on(table.provider, table.instanceId),
  ownerUnique: unique("wa_accounts_owner_unique").on(table.ownerMemberId),
  tenantIdx: index("idx_wa_accounts_tenant").on(table.tenantId),
  statusIdx: index("idx_wa_accounts_status").on(table.status),
}));

// ========================================
// THREADS (Conversas)
// ========================================

export const threads = pgTable("threads", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").notNull().references(() => whatsappAccounts.id, { onDelete: "cascade" }),
  remoteJid: varchar("remote_jid", { length: 255 }).notNull(),
  contactName: varchar("contact_name", { length: 255 }),
  contactPhone: varchar("contact_phone", { length: 20 }),
  isGroup: boolean("is_group").default(false).notNull(),

  // Assignment & Organization
  assignedTo: uuid("assigned_to").references(() => tenantMembers.id, { onDelete: "set null" }),
  assignedAt: timestamp("assigned_at"),
  tags: text("tags").array(),
  status: threadStatus("status").default("open").notNull(),

  // Metrics
  unreadCount: integer("unread_count").default(0).notNull(),
  lastMessageContent: text("last_message_content"),
  lastMessageAt: timestamp("last_message_at"),
  firstResponseAt: timestamp("first_response_at"),
  resolvedAt: timestamp("resolved_at"),

  // Metadata
  archived: boolean("archived").default(false).notNull(),
  pictureUrl: text("picture_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  accountRemoteUnique: unique("threads_account_remote_unique").on(table.accountId, table.remoteJid),
  tenantIdx: index("idx_threads_tenant").on(table.tenantId),
  accountIdx: index("idx_threads_account").on(table.accountId),
  assignedIdx: index("idx_threads_assigned").on(table.assignedTo),
  statusIdx: index("idx_threads_status").on(table.status),
  lastMsgIdx: index("idx_threads_last_msg").on(table.lastMessageAt),
}));

// ========================================
// MESSAGES
// ========================================

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  threadId: uuid("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),

  // WhatsApp IDs
  messageId: varchar("message_id", { length: 255 }).notNull(),
  remoteJid: varchar("remote_jid", { length: 255 }).notNull(),

  // Content
  fromJid: varchar("from_jid", { length: 255 }).notNull(),
  toJid: varchar("to_jid", { length: 255 }).notNull(),
  isFromMe: boolean("is_from_me").default(false).notNull(),
  contentType: messageContentType("content_type").default("text").notNull(),
  body: text("body"),

  // Media
  hasMedia: boolean("has_media").default(false).notNull(),
  mediaType: varchar("media_type", { length: 100 }),
  mediaUrl: text("media_url"),
  mediaSize: integer("media_size"),

  // Status & Metadata
  status: whatsappMessageStatus("status").default("pending").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  contextInfo: jsonb("context_info"),

  // Internal
  clientMessageId: varchar("client_message_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_messages_tenant").on(table.tenantId),
  threadIdx: index("idx_messages_thread").on(table.threadId, table.timestamp),
  messageIdIdx: index("idx_messages_message_id").on(table.messageId),
  messageThreadUnique: unique("messages_message_thread_unique").on(table.threadId, table.messageId),
  timestampIdx: index("idx_messages_timestamp").on(table.timestamp),
}));

// ========================================
// WEBHOOK EVENTS (Audit & Raw)
// ========================================

export const webhookEventsRaw = pgTable("webhook_events_raw", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  correlationId: uuid("correlation_id").notNull(),
  eventType: varchar("event_type", { length: 120 }).notNull(),
  provider: whatsappProvider("provider").notNull(),
  payload: jsonb("payload").notNull(),
  processed: boolean("processed").default(false).notNull(),
  receivedAt: timestamp("received_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_webhook_raw_tenant").on(table.tenantId),
  correlationIdx: index("idx_webhook_raw_correlation").on(table.correlationId),
  receivedIdx: index("idx_webhook_raw_received").on(table.receivedAt),
}));

// ========================================
// AI SUGGESTIONS
// ========================================

export const aiSuggestions = pgTable("ai_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  threadId: uuid("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "cascade" }),
  agentId: uuid("agent_id"),
  suggestedText: text("suggested_text").notNull(),
  reasoningSummary: jsonb("reasoning_summary").notNull(),
  goalProgress: integer("goal_progress").default(0).notNull(),
  goalText: text("goal_text"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  threadIdx: index("idx_ai_suggestions_thread").on(table.threadId),
}));

// ========================================
// COPILOT: AGENTS + KNOWLEDGE BASE
// ========================================

export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  ownerMemberId: uuid("owner_member_id").notNull().references(() => tenantMembers.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 120 }).notNull(),
  avatarUrl: text("avatar_url"),
  promptBase: text("prompt_base"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("idx_agents_owner").on(table.ownerMemberId),
  tenantIdx: index("idx_agents_tenant").on(table.tenantId),
}));

export const knowledgeItemType = pgEnum("knowledge_item_type", [
  "text",
  "url",
  "pdf",
]);

export const companyKnowledgeItems = pgTable("company_knowledge_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  type: knowledgeItemType("type").notNull(),
  content: text("content").notNull(),
  createdByMemberId: uuid("created_by_member_id").notNull().references(() => tenantMembers.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("idx_company_knowledge_tenant").on(table.tenantId),
}));

export const sellerKnowledgeItems = pgTable("seller_knowledge_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  ownerMemberId: uuid("owner_member_id").notNull().references(() => tenantMembers.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  type: knowledgeItemType("type").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index("idx_seller_knowledge_owner").on(table.ownerMemberId),
  tenantIdx: index("idx_seller_knowledge_tenant").on(table.tenantId),
}));

export const conversationGoals = pgTable("conversation_goals", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  threadId: uuid("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
  goalText: text("goal_text").notNull(),
  progress: integer("progress").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  threadIdx: index("idx_conversation_goals_thread").on(table.threadId),
}));

// ========================================
// LEGACY TABLES (manter para compatibilidade)
// ========================================

export const whatsappSessions = pgTable("whatsapp_sessions", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
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
  remoteJid: varchar("remote_jid", { length: 255 }),
  pushName: varchar("push_name", { length: 255 }),
  chatId: varchar("chat_id", { length: 255 }).notNull(),
  from: varchar("from", { length: 255 }).notNull(),
  to: varchar("to", { length: 255 }).notNull(),
  body: text("body"),
  timestamp: timestamp("timestamp"),
  status: whatsappMessageStatus("status").default("pending"),
  contextInfo: jsonb("context_info"),
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
  pictureUrl: text("picture_url"),
  lastMessageContent: text("last_message_content"),
  isArchived: boolean("is_archived").default(false),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const whatsappWebhooksRaw = pgTable("whatsapp_webhooks_raw", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull(),
  eventType: varchar("event_type", { length: 120 }).notNull(),
  payload: jsonb("payload").notNull(),
  receivedAt: timestamp("received_at").defaultNow(),
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

// ========================================
// TYPES
// ========================================

export type Tenant = typeof tenants.$inferSelect;
export type TenantInsert = typeof tenants.$inferInsert;

export type TenantMember = typeof tenantMembers.$inferSelect;
export type TenantMemberInsert = typeof tenantMembers.$inferInsert;

export type WhatsAppAccount = typeof whatsappAccounts.$inferSelect;
export type WhatsAppAccountInsert = typeof whatsappAccounts.$inferInsert;

export type Thread = typeof threads.$inferSelect;
export type ThreadInsert = typeof threads.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type MessageInsert = typeof messages.$inferInsert;

export type WebhookEventRaw = typeof webhookEventsRaw.$inferSelect;
export type WebhookEventRawInsert = typeof webhookEventsRaw.$inferInsert;

export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type AiSuggestionInsert = typeof aiSuggestions.$inferInsert;

export type Agent = typeof agents.$inferSelect;
export type AgentInsert = typeof agents.$inferInsert;

export type CompanyKnowledgeItem = typeof companyKnowledgeItems.$inferSelect;
export type CompanyKnowledgeItemInsert = typeof companyKnowledgeItems.$inferInsert;

export type SellerKnowledgeItem = typeof sellerKnowledgeItems.$inferSelect;
export type SellerKnowledgeItemInsert = typeof sellerKnowledgeItems.$inferInsert;

export type ConversationGoal = typeof conversationGoals.$inferSelect;
export type ConversationGoalInsert = typeof conversationGoals.$inferInsert;

// Legacy types
export type WhatsAppSession = typeof whatsappSessions.$inferSelect;
export type WhatsAppMessage = typeof whatsappMessages.$inferSelect;
export type WhatsAppChat = typeof whatsappChats.$inferSelect;
export type WhatsAppMedia = typeof whatsappMedia.$inferSelect;
export type WhatsAppWebhookRaw = typeof whatsappWebhooksRaw.$inferSelect;
export type SuggestedResponse = typeof suggestedResponses.$inferSelect;
