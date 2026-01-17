CREATE TABLE IF NOT EXISTS "suggested_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"message_id" varchar(255) NOT NULL,
	"suggestions" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_chats" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"chat_id" varchar(255),
	"name" varchar(255) NOT NULL,
	"is_group" boolean DEFAULT false,
	"unread_count" integer DEFAULT 0,
	"last_message_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "whatsapp_chats_chat_id_unique" UNIQUE("chat_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_media" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"message_id" varchar(255) NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"file_size" integer,
	"s3_key" varchar(500) NOT NULL,
	"s3_url" varchar(500) NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"message_id" varchar(255),
	"chat_id" varchar(255) NOT NULL,
	"from" varchar(255) NOT NULL,
	"to" varchar(255) NOT NULL,
	"body" text,
	"timestamp" timestamp,
	"is_from_me" boolean DEFAULT false,
	"has_media" boolean DEFAULT false,
	"media_type" varchar(50),
	"media_url" varchar(500),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "whatsapp_messages_message_id_unique" UNIQUE("message_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "whatsapp_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"phone_number" varchar(20),
	"is_connected" boolean DEFAULT false,
	"is_ready" boolean DEFAULT false,
	"last_connected_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
