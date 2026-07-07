CREATE TABLE "homelab_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"snapshot_id" uuid NOT NULL,
	"source" varchar(32) NOT NULL,
	"kind" varchar(32) NOT NULL,
	"name" varchar(200) NOT NULL,
	"host_ip" varchar(45),
	"port" integer,
	"internal_port" integer,
	"protocol" varchar(8),
	"url" text,
	"state" varchar(32),
	"stack" varchar(200),
	"image" text,
	"tags" json,
	"raw" json
);
--> statement-breakpoint
CREATE TABLE "homelab_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"taken_at" timestamp DEFAULT now() NOT NULL,
	"status" varchar(16) DEFAULT 'ok' NOT NULL,
	"container_count" integer DEFAULT 0 NOT NULL,
	"vm_count" integer DEFAULT 0 NOT NULL,
	"coolify_app_count" integer DEFAULT 0 NOT NULL,
	"coolify_db_count" integer DEFAULT 0 NOT NULL,
	"coolify_service_count" integer DEFAULT 0 NOT NULL,
	"errors" text,
	"raw_unraid" json,
	"raw_coolify" json
);
--> statement-breakpoint
CREATE TABLE "policy_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question" text NOT NULL,
	"answer" text,
	"citations" json DEFAULT '[]'::json,
	"match_count" integer DEFAULT 0 NOT NULL,
	"asker_role" varchar(16) DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "policy_documents" ADD COLUMN "embed_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "policy_documents" ADD COLUMN "update_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "policy_documents" ADD COLUMN "content_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "policy_sync_jobs" ADD COLUMN "errors" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "policy_sync_jobs" ADD COLUMN "chunks_created" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "policy_sync_jobs" ADD COLUMN "embed_tokens" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "policy_sync_jobs" ADD COLUMN "details" json DEFAULT '[]'::json;--> statement-breakpoint
ALTER TABLE "homelab_resources" ADD CONSTRAINT "homelab_resources_snapshot_id_homelab_snapshots_id_fk" FOREIGN KEY ("snapshot_id") REFERENCES "public"."homelab_snapshots"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "homelab_resources_snapshot_idx" ON "homelab_resources" USING btree ("snapshot_id");--> statement-breakpoint
CREATE INDEX "homelab_resources_host_port_idx" ON "homelab_resources" USING btree ("host_ip","port");--> statement-breakpoint
CREATE INDEX "homelab_resources_name_idx" ON "homelab_resources" USING btree ("name");--> statement-breakpoint
CREATE INDEX "homelab_resources_stack_idx" ON "homelab_resources" USING btree ("stack");