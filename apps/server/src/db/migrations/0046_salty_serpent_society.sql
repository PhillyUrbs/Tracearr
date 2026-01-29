ALTER TABLE "rules" ALTER COLUMN "type" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "rules" ALTER COLUMN "params" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN "conditions" jsonb;--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN "actions" jsonb;--> statement-breakpoint
ALTER TABLE "rules" ADD COLUMN "server_id" uuid;--> statement-breakpoint
ALTER TABLE "rules" ADD CONSTRAINT "rules_server_id_servers_id_fk" FOREIGN KEY ("server_id") REFERENCES "public"."servers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "rules_server_id_idx" ON "rules" USING btree ("server_id");