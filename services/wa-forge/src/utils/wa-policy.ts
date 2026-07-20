/**
 * WhatsApp GDPR Opt-Out Policy — Migrated from apps/dashboard/lib/whatsapp-policy.ts
 * Uses Prisma directly and Redis pub/sub instead of Nuxt broadcastToTeam
 */
import { PrismaClient } from '@waforge/database'
import { publishEvent } from './redis'

const prisma = new PrismaClient()

export async function handleOptOutKeywords(fullPhone: string, text: string, teamId: string) {
  const normalizedText = text.trim().toUpperCase()

  if (normalizedText === 'STOP MARKETING') {
    await prisma.contact.updateMany({ where: { fullPhone, teamId }, data: { optInMarketing: false, consentStatus: 'DENIED' } })
    await trackCampaignOptOut(fullPhone, teamId)
    return true
  }

  if (normalizedText === 'STOP' || normalizedText === 'STOP ALL') {
    await prisma.contact.updateMany({ where: { fullPhone, teamId }, data: { optInMarketing: false, optInTransactional: false, consentStatus: 'DENIED' } })
    await trackCampaignOptOut(fullPhone, teamId)
    return true
  }

  if (normalizedText === 'START' || normalizedText === 'SI') {
    await prisma.contact.updateMany({ where: { fullPhone, teamId }, data: { optInMarketing: true, optInTransactional: true, consentStatus: 'GRANTED' } })
    return true
  }

  if (normalizedText === 'NO') {
    await prisma.contact.updateMany({ where: { fullPhone, teamId }, data: { consentStatus: 'DENIED' } })
    await trackCampaignOptOut(fullPhone, teamId)
    return true
  }

  return false
}

async function trackCampaignOptOut(fullPhone: string, teamId: string) {
  const contact = await prisma.contact.findUnique({ where: { teamId_fullPhone: { teamId, fullPhone } } })
  if (!contact) return

  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000)
  const recentMessage = await prisma.message.findFirst({
    where: { contactId: contact.id, campaignId: { not: null }, createdAt: { gte: seventyTwoHoursAgo } },
    orderBy: { createdAt: 'desc' }
  })

  if (recentMessage && recentMessage.campaignId) {
    const updatedCampaign = await prisma.campaign.update({
      where: { id: recentMessage.campaignId },
      data: { optOutCount: { increment: 1 } }
    })
    publishEvent(teamId, 'campaign_updated', updatedCampaign)
  }
}
