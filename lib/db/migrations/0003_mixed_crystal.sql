ALTER TABLE "homelab_snapshots" ADD COLUMN "caddy_route_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "homelab_snapshots" ADD COLUMN "raw_caddy" json;