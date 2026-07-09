-- AlterTable
ALTER TABLE "Contact" ADD COLUMN "isOnWhatsApp" BOOLEAN;

-- AlterTable
ALTER TABLE "Template" ADD COLUMN "mediaUrl" TEXT,
ADD COLUMN "mediaType" TEXT NOT NULL DEFAULT 'text';
