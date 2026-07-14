-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "optOutCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Contact" 
ADD COLUMN IF NOT EXISTS "consentStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS "declarantName" TEXT,
ADD COLUMN IF NOT EXISTS "declarantPhone" TEXT,
ADD COLUMN IF NOT EXISTS "labels" TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "pec" TEXT,
ADD COLUMN IF NOT EXISTS "secondaryPhones" TEXT DEFAULT '[]',
ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'manual';

-- AlterTable
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "brandSettings" JSONB;

-- CreateTable
CREATE TABLE IF NOT EXISTS "ContactGroup" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "_ContactToContactGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "ContactGroup_teamId_name_key" ON "ContactGroup"("teamId", "name");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "_ContactToContactGroup_AB_unique" ON "_ContactToContactGroup"("A", "B");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "_ContactToContactGroup_B_index" ON "_ContactToContactGroup"("B");

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "ContactGroup" ADD CONSTRAINT "ContactGroup_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "_ContactToContactGroup" ADD CONSTRAINT "_ContactToContactGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
 ALTER TABLE "_ContactToContactGroup" ADD CONSTRAINT "_ContactToContactGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "ContactGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
