/**
 * Campaign BullMQ Worker — Message sender with anti-ban protections
 * Migrated from apps/dashboard/server/utils/job-queue.ts
 */
import { Worker, type Job } from 'bullmq'
import { PrismaClient } from '@waforge/database'
import { connection, campaignQueue, publishEvent, DAILY_SEND_CAP, getDailySendCount, incrementDailySendCount } from '../utils/redis'
import { sendMessage, sendMedia, renderTemplate, checkPhone, sendPresence } from '../utils/engines'
import { expandSpintax } from '../utils/spintax'

const prisma = new PrismaClient()

// ── Anti-Ban Constants ────────────────────────────────────────────────────────

const BUSINESS_HOURS = { start: 7, end: 22 }

function gaussianRandom(mean: number, stddev: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2)
  return Math.max(0, mean + z * stddev)
}

function isBusinessHours(): boolean {
  const hour = new Date().getUTCHours()
  return hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end
}

// ── Campaign Worker ───────────────────────────────────────────────────────────

export const campaignWorker = new Worker('campaigns', async (job: Job) => {
  const { campaignId, contactId, teamId } = job.data

  // Anti-Ban: Business Hours Guard
  if (!isBusinessHours()) {
    await campaignQueue.add('send-message', job.data, { delay: 30 * 60 * 1000 })
    return { skipped: true, reason: 'Outside business hours, rescheduled' }
  }

  // Anti-Ban: Daily Send Cap
  const dailyCount = await getDailySendCount(teamId)
  if (dailyCount >= DAILY_SEND_CAP) {
    const updated = await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'PAUSED' } })
    publishEvent(teamId, 'campaign_updated', updated)
    console.warn(`[ANTI-BAN] Team ${teamId} hit daily cap (${DAILY_SEND_CAP}). Campaign ${campaignId} auto-paused.`)
    return { skipped: true, reason: 'Daily send cap reached, campaign auto-paused' }
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId }, include: { template: true } })
  if (!campaign || campaign.status !== 'RUNNING') return { skipped: true, reason: 'Campaign not running' }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } })
  if (!contact) return { skipped: true, reason: 'Contact not found' }

  const session = await prisma.whatsAppSession.findFirst({ where: { teamId } })
  if (!session || !session.token) throw new Error(`WhatsApp Session not connected for team ${teamId}`)

  // Template rendering + Spintax
  let body = renderTemplate(campaign.template.body, { Name: contact.name, Phone: contact.fullPhone, Email: contact.email, Company: contact.company })
  body = expandSpintax(body)

  // Anti-Ban: Zero-Width Randomization
  const zwChars = ['\u200B', '\u200C', '\u200D', '\uFEFF']
  const zwCount = Math.floor(Math.random() * 6) + 3
  for (let i = 0; i < zwCount; i++) body += zwChars[Math.floor(Math.random() * zwChars.length)]

  // GDPR Disclaimer
  let gdprDisclaimerSent = false
  if (campaign.includeGdprDisclaimer && !contact.gdprNotified) gdprDisclaimerSent = true

  const targetPhone = job.data.targetPhone || contact.fullPhone

  // Anti-Ban: Pre-verify WhatsApp number
  const isTargetValid = await checkPhone(session.token, targetPhone)
  if (!isTargetValid) {
    console.log(`[ANTI-BAN] Skipped ${targetPhone}: Not on WhatsApp`)
    await prisma.message.create({ data: { contactId, campaignId, body: '[SKIPPED - NON SU WHATSAPP]', status: 'FAILED', errorReason: 'Numero non registrato su WhatsApp' } })
    const updatedCampaign = await prisma.campaign.update({ where: { id: campaignId }, data: { failedCount: { increment: 1 } } })
    publishEvent(teamId, 'campaign_updated', updatedCampaign)
    return { skipped: true, reason: 'Not on WhatsApp' }
  }

  // Anti-Ban: Typing Simulation
  await sendPresence(session.token, targetPhone, body.length)

  // Send via engine
  let result
  let effectiveMediaType = campaign.template.mediaType || 'text'
  if (campaign.template.mediaUrl && effectiveMediaType === 'text') {
    const ext = campaign.template.mediaUrl.split('.').pop()?.toLowerCase() || ''
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) effectiveMediaType = 'image'
    else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) effectiveMediaType = 'video'
    else if (['mp3', 'ogg', 'wav'].includes(ext)) effectiveMediaType = 'audio'
    else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip'].includes(ext)) effectiveMediaType = 'document'
  }

  if (campaign.template.mediaUrl && effectiveMediaType !== 'text') {
    result = await sendMedia(session.token, targetPhone, effectiveMediaType as any, campaign.template.mediaUrl, body)
  } else if (campaign.template.mediaUrl && effectiveMediaType === 'text') {
    result = await sendMessage(session.token, targetPhone, `${body}\n\n🔗 ${campaign.template.mediaUrl}`)
  } else {
    result = await sendMessage(session.token, targetPhone, body)
  }

  // GDPR disclaimer follow-up
  if (gdprDisclaimerSent && result.success) {
    const gdprMsg = '*Informativa Privacy:* Ricevi questo messaggio perché hai prestato il consenso. Rispondi STOP in qualsiasi momento per disiscriverti.'
    await sendPresence(session.token, targetPhone, gdprMsg.length)
    await sendMessage(session.token, targetPhone, gdprMsg)
  }

  // Anti-Ban: Auto-Pause on ban signals
  if (!result.success && result.error) {
    const errorStr = result.error.toLowerCase()
    const isBanSignal = errorStr.includes('403') || errorStr.includes('fingerprint') || errorStr.includes('blocked') || errorStr.includes('security policy') || errorStr.includes('too many') || errorStr.includes('invalid device') || errorStr.includes('invalid session')
    if (isBanSignal) {
      await prisma.campaign.updateMany({ where: { teamId, status: 'RUNNING' }, data: { status: 'PAUSED' } })
      console.error(`[ANTI-BAN] 🚨 Ban signal for team ${teamId}: ${result.error}. ALL campaigns auto-paused.`)
    }
  }

  // Record message
  await prisma.message.create({ data: { contactId, campaignId, body, status: result.success ? 'SENT' : 'FAILED', errorReason: result.error || null, wuzapiMsgId: result.messageId || null, sentAt: result.success ? new Date() : null } })

  if (result.success) {
    await incrementDailySendCount(teamId)
    if (gdprDisclaimerSent) await prisma.contact.update({ where: { id: contactId }, data: { gdprNotified: true } })
  }

  const updatedCampaign = await prisma.campaign.update({ where: { id: campaignId }, data: result.success ? { sentCount: { increment: 1 } } : { failedCount: { increment: 1 } } })

  let isCompleted = false
  if (updatedCampaign.sentCount + updatedCampaign.failedCount >= updatedCampaign.totalCount) {
    await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'COMPLETED' } })
    isCompleted = true
  }

  publishEvent(teamId, 'campaign_updated', { ...updatedCampaign, status: isCompleted ? 'COMPLETED' : updatedCampaign.status })
  return { success: result.success, messageId: result.messageId }

}, { connection: connection as any, concurrency: 1 }) // Anti-Ban: 1 message at a time

// ── Verify Worker ─────────────────────────────────────────────────────────────

export const verifyWorker = new Worker('verifications', async (job: Job) => {
  const { contactId, teamId, phone } = job.data
  const session = await prisma.whatsAppSession.findFirst({ where: { teamId } })
  if (!session || !session.token) return { skipped: true, reason: 'No session' }
  const isValid = await checkPhone(session.token, phone)
  await prisma.contact.update({ where: { id: contactId }, data: { isOnWhatsApp: isValid } })
  return { success: true, isValid }
}, { connection: connection as any, concurrency: 2 })

// ── Public Actions ────────────────────────────────────────────────────────────

export async function startCampaign(campaignId: string, teamId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId, teamId } })
  if (!campaign) throw new Error('Campaign not found')

  let contacts
  if (campaign.contactIds === 'ALL') {
    contacts = await prisma.contact.findMany({ where: { teamId, isActive: true, isOnWhatsApp: { not: false }, consentStatus: { not: 'DENIED' } } })
  } else {
    const parsedIds: string[] = JSON.parse(campaign.contactIds)
    const groupIds = parsedIds.filter(id => id.startsWith('GROUP:')).map(id => id.replace('GROUP:', ''))
    const explicitIds = parsedIds.filter(id => !id.startsWith('GROUP:'))
    const conditions: any[] = []
    if (explicitIds.length > 0) conditions.push({ id: { in: explicitIds } })
    if (groupIds.length > 0) conditions.push({ groups: { some: { id: { in: groupIds } } } })
    contacts = conditions.length > 0 ? await prisma.contact.findMany({ where: { teamId, isActive: true, isOnWhatsApp: { not: false }, consentStatus: { not: 'DENIED' }, OR: conditions } }) : []
  }

  const existingMessages = await prisma.message.findMany({ where: { campaignId }, select: { contactId: true } })
  const processedContactIds = new Set(existingMessages.map(m => m.contactId))
  const remainingContacts = contacts.filter(c => !processedContactIds.has(c.id))

  if (remainingContacts.length === 0) {
    const updated = await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'COMPLETED', completedAt: new Date() } })
    publishEvent(teamId, 'campaign_updated', updated)
    return
  }

  const updated = await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'RUNNING', totalCount: contacts.length, startedAt: campaign.startedAt || new Date() } })
  publishEvent(teamId, 'campaign_updated', updated)

  const meanDelay = Math.max(10000, campaign.delayMin * 1000)
  const stddev = Math.max(2000, (campaign.delayMax - campaign.delayMin) * 500)
  let cumulativeDelay = 0

  const jobs: any[] = []
  for (const contact of remainingContacts) {
    const phonesToSend: string[] = [contact.fullPhone]
    if (contact.secondaryPhones) {
      try {
        const sec = JSON.parse(contact.secondaryPhones)
        if (Array.isArray(sec)) sec.forEach((sp: string) => { const c = sp.replace(/\D/g, ''); if (c && !phonesToSend.includes(c)) phonesToSend.push(c) })
      } catch {
        contact.secondaryPhones.split(',').map(s => s.trim().replace(/\D/g, '')).forEach(p => { if (p && !phonesToSend.includes(p)) phonesToSend.push(p) })
      }
    }

    for (const targetPhone of phonesToSend) {
      const jitter = Math.max(8000, gaussianRandom(meanDelay, stddev))
      cumulativeDelay += jitter
      jobs.push({ name: 'send-message', data: { campaignId, contactId: contact.id, teamId, targetPhone }, opts: { delay: Math.floor(cumulativeDelay) } })
    }
  }

  const totalTargetCount = jobs.length + existingMessages.length
  if (totalTargetCount !== contacts.length) {
    await prisma.campaign.update({ where: { id: campaignId }, data: { totalCount: totalTargetCount } })
  }

  await campaignQueue.addBulk(jobs)
}

export async function pauseCampaign(campaignId: string, teamId: string) {
  const updated = await prisma.campaign.update({ where: { id: campaignId, teamId }, data: { status: 'PAUSED' } })
  publishEvent(teamId, 'campaign_updated', updated)
  return true
}

export async function getCampaignProgress(campaignId: string, teamId: string) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId, teamId } })
  if (!campaign) return null
  const progress = campaign.totalCount > 0 ? Math.round(((campaign.sentCount + campaign.failedCount) / campaign.totalCount) * 100) : 0
  return { ...campaign, progress, isActive: campaign.status === 'RUNNING' }
}

export async function startVerificationJob(teamId: string, contactIds?: string[]) {
  const { verifyQueue } = await import('../utils/redis')
  let contacts
  if (contactIds && contactIds.length > 0) contacts = await prisma.contact.findMany({ where: { id: { in: contactIds }, teamId } })
  else contacts = await prisma.contact.findMany({ where: { teamId, isOnWhatsApp: null } })
  const jobs = contacts.map(c => ({ name: 'verify-contact', data: { contactId: c.id, teamId, phone: c.fullPhone } }))
  await verifyQueue.addBulk(jobs)
  return jobs.length
}

console.log('🔧 Campaign Worker & Verify Worker started')
