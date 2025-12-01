ALTER TABLE "settings" ADD COLUMN "external_url" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "base_path" varchar(100) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "trust_proxy" boolean DEFAULT false NOT NULL;