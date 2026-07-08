-- AlterTable: Add optIn fields to Contact
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "optInMarketing" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "optInTransactional" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex: Add unique constraint on ChatMessage.wamid
CREATE UNIQUE INDEX IF NOT EXISTS "ChatMessage_wamid_key" ON "ChatMessage"("wamid");
