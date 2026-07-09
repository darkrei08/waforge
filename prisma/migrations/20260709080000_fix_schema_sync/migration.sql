-- CreateTable: WhatsAppConversation
CREATE TABLE "WhatsAppConversation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: WhatsAppScheduledMessage
CREATE TABLE "WhatsAppScheduledMessage" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "metadata" JSONB,
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhatsAppScheduledMessage_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Add opt-in columns to Contact
ALTER TABLE "Contact" ADD COLUMN "optInMarketing" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Contact" ADD COLUMN "optInTransactional" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable: Add missing columns to ChatMessage
ALTER TABLE "ChatMessage" ADD COLUMN "wamid" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "ChatMessage" ADD COLUMN "metadata" JSONB;
ALTER TABLE "ChatMessage" ADD COLUMN "conversationId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ChatMessage_wamid_key" ON "ChatMessage"("wamid");

-- CreateIndex
CREATE UNIQUE INDEX "WhatsAppConversation_teamId_contactId_key" ON "WhatsAppConversation"("teamId", "contactId");

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsAppConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppConversation" ADD CONSTRAINT "WhatsAppConversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppScheduledMessage" ADD CONSTRAINT "WhatsAppScheduledMessage_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhatsAppScheduledMessage" ADD CONSTRAINT "WhatsAppScheduledMessage_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
