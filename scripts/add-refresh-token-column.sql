ALTER TABLE "api_users"
ADD COLUMN IF NOT EXISTS "refresh_token_hash" character varying(64);
