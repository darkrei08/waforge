-- AlterTable: Add llmSettings JSON column to Team
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "llmSettings" JSONB;

-- AlterTable: Add includeGdprDisclaimer to Campaign
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "includeGdprDisclaimer" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add gdprNotified to Contact (if missing)
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "gdprNotified" BOOLEAN NOT NULL DEFAULT false;
