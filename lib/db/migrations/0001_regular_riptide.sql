CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "policy_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"section_id" uuid,
	"kind" varchar(16) NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1024),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"topic_id" uuid,
	"policy_code" varchar(32),
	"title" text NOT NULL,
	"source_url" text NOT NULL,
	"download_url" text,
	"content_hash" varchar(64),
	"parsed_text" text,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "policy_documents_source_url_unique" UNIQUE("source_url")
);
--> statement-breakpoint
CREATE TABLE "policy_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"ordinal" integer DEFAULT 0 NOT NULL,
	"heading" text,
	"content" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "policy_sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" varchar(16) DEFAULT 'running' NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"completed" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"message" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "policy_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(8) NOT NULL,
	"name" varchar(200) NOT NULL,
	"ordinal" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "policy_topics_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "projects" DROP CONSTRAINT "projects_original_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "policy_chunks" ADD CONSTRAINT "policy_chunks_document_id_policy_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."policy_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_chunks" ADD CONSTRAINT "policy_chunks_section_id_policy_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."policy_sections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_documents" ADD CONSTRAINT "policy_documents_topic_id_policy_topics_id_fk" FOREIGN KEY ("topic_id") REFERENCES "public"."policy_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "policy_sections" ADD CONSTRAINT "policy_sections_document_id_policy_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."policy_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "policy_chunks_document_idx" ON "policy_chunks" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "policy_chunks_embedding_idx" ON "policy_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint
CREATE INDEX "policy_documents_topic_idx" ON "policy_documents" USING btree ("topic_id");--> statement-breakpoint
CREATE INDEX "policy_sections_document_idx" ON "policy_sections" USING btree ("document_id");