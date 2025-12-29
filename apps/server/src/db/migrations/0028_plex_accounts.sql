-- Multi-Plex Account Support Migration
-- Allows owners to link multiple Plex.tv accounts to add servers from different accounts

-- Step 1: Create plex_accounts table
CREATE TABLE IF NOT EXISTS "plex_accounts" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "plex_account_id" VARCHAR(255) NOT NULL,
  "plex_username" VARCHAR(255),
  "plex_email" VARCHAR(255),
  "plex_thumbnail" VARCHAR(500),
  "plex_token" VARCHAR(500) NOT NULL,
  "allow_login" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT "plex_accounts_plex_account_id_unique" UNIQUE("plex_account_id"),
  CONSTRAINT "plex_accounts_user_plex_unique" UNIQUE("user_id", "plex_account_id")
);

-- Indexes for plex_accounts
CREATE INDEX IF NOT EXISTS "plex_accounts_user_idx" ON "plex_accounts" ("user_id");
CREATE INDEX IF NOT EXISTS "plex_accounts_allow_login_idx" ON "plex_accounts" ("plex_account_id", "allow_login");

-- Step 2: Add plex_account_id column to servers table (nullable for Jellyfin/Emby and legacy)
ALTER TABLE "servers" ADD COLUMN IF NOT EXISTS "plex_account_id" UUID REFERENCES "plex_accounts"("id");
CREATE INDEX IF NOT EXISTS "servers_plex_account_idx" ON "servers" ("plex_account_id");

-- Step 3: Migrate existing users with Plex accounts
-- Creates plex_accounts entries for users who have plexAccountId and at least one Plex server
-- The first Plex server's token is used (they should all have the same token)
INSERT INTO "plex_accounts" ("user_id", "plex_account_id", "plex_token", "allow_login", "created_at")
SELECT DISTINCT ON (u.id)
  u.id,
  u.plex_account_id,
  s.token,
  true,  -- First/migrated account gets login permission
  NOW()
FROM "users" u
JOIN "servers" s ON s.type = 'plex' AND s.token IS NOT NULL
WHERE u.plex_account_id IS NOT NULL
ON CONFLICT ("plex_account_id") DO NOTHING;

-- Step 4: Link existing Plex servers to migrated accounts
-- Links all Plex servers to the owner's plex_account (assumes single owner model)
UPDATE "servers" s
SET "plex_account_id" = pa.id
FROM "plex_accounts" pa
WHERE pa.user_id = (SELECT id FROM "users" WHERE role = 'owner' LIMIT 1)
  AND s.type = 'plex'
  AND s."plex_account_id" IS NULL;
