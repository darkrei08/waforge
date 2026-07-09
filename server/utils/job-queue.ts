import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { prisma } from './prisma'
import { sendMessage, sendMedia, renderTemplate, checkPhone } from '~/lib/whatsapp-engine'
import { expandSpintax } from '~/lib/spintax'

// Gestione Singleton per HMR di Nuxt in sviluppo
declare global {
  var __redis: IORedis | undefined
  var __campaignQueue: Queue | undefined
  var __campaignWorker: Worker | undefined
  var __verifyQueue: Queue | undefined
  var __verifyWorker: Worker | undefined
}

// Legge dinamicamente process.env a runtime aggirando il bundler
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  return undefined
}

const getRedisUrl = () => {
  return getEnv('REDIS_URL') || getEnv('NUXT_REDIS_URL') || 'redis://localhost:6379'
}

export const connection = globalThis.__redis || new IORedis(getRedisUrl(), {
  maxRetriesPerRequest: null // Required by BullMQ
})
if (process.env.NODE_ENV !== 'production') globalThis.__redis = connection

export const campaignQueue = globalThis.__campaignQueue || new Queue('campaigns', { connection: connection as any })
if (process.env.NODE_ENV !== 'production') globalThis.__campaignQueue = campaignQueue

export const verifyQueue = globalThis.__verifyQueue || new Queue('verifications', { connection: connection as any })
if (process.env.NODE_ENV !== 'production') globalThis.__verifyQueue = verifyQueue

// ── Worker (Processore in Background) ────────────────────────────────────────

export const campaignWorker = globalThis.__campaignWorker || new Worker('campaigns', async (job: Job) => {
  const { campaignId, contactId, teamId } = job.data

  // Verifica che la campagna sia ancora in RUNNING
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { template: true }
  })
  
  if (!campaign || campaign.status !== 'RUNNING') {
    // Se in pausa, il job viene ignorato (verrà reinserito al resume)
    return { skipped: true, reason: 'Campaign not running' }
  }

  const contact = await prisma.contact.findUnique({ where: { id: contactId } })
  if (!contact) return { skipped: true, reason: 'Contact not found' }

  // Recupera la sessione WuzAPI associata a questo specifico Team!
  const session = await prisma.whatsAppSession.findFirst({ where: { teamId } })
  if (!session || !session.token) {
    throw new Error(`WhatsApp Session not connected for team ${teamId}`)
  }

  // Rendering template e Spintax
  let body = renderTemplate(campaign.template.body, {
    Name: contact.name,
    Phone: contact.fullPhone,
    Email: contact.email,
    Company: contact.company,
  })
  if (process.env.SPINTAX_ENABLED !== 'false') {
    body = expandSpintax(body)
  }

  // Chiamata all'Engine Multi-Tenant
  let result
  if (campaign.template.mediaUrl && campaign.template.mediaType && campaign.template.mediaType !== 'text') {
    result = await sendMedia(
      session.token, 
      contact.fullPhone, 
      campaign.template.mediaType as any, 
      campaign.template.mediaUrl, 
      body
    )
  } else {
    result = await sendMessage(session.token, contact.fullPhone, body)
  }

  // Registra il risultato del messaggio
  await prisma.message.create({
    data: {
      contactId,
      campaignId,
      body,
      status: result.success ? 'SENT' : 'FAILED',
      errorReason: result.error || null,
      wuzapiMsgId: result.messageId || null,
      sentAt: result.success ? new Date() : null,
    }
  })

  // Aggiorna i contatori live della campagna
  await prisma.campaign.update({
    where: { id: campaignId },
    data: result.success 
      ? { sentCount: { increment: 1 } }
      : { failedCount: { increment: 1 } }
  })

  // Se è l'ultimo messaggio, potremmo segnare la campagna come completata
  // (per semplicità lasciamo a un job di cleanup o al frontend)
  return { success: result.success, messageId: result.messageId }

}, { connection: connection as any, concurrency: 5 })

if (process.env.NODE_ENV !== 'production') globalThis.__campaignWorker = campaignWorker

export const verifyWorker = globalThis.__verifyWorker || new Worker('verifications', async (job: Job) => {
  const { contactId, teamId, phone } = job.data

  const session = await prisma.whatsAppSession.findFirst({ where: { teamId } })
  if (!session || !session.token) return { skipped: true, reason: 'No session' }

  const isValid = await checkPhone(session.token, phone)
  
  await prisma.contact.update({
    where: { id: contactId },
    data: { isOnWhatsApp: isValid }
  })

  return { success: true, isValid }
}, { connection: connection as any, concurrency: 2 })

if (process.env.NODE_ENV !== 'production') globalThis.__verifyWorker = verifyWorker

// ── Azioni Pubbliche ─────────────────────────────────────────────────────────

export async function startCampaign(campaignId: string, teamId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId, teamId }
  })
  if (!campaign) throw new Error('Campaign not found')

  // Trova i contatti (escludendo quelli che hanno già ricevuto un messaggio per questa campagna)
  let contacts
  if (campaign.contactIds === 'ALL') {
    contacts = await prisma.contact.findMany({ where: { teamId, isActive: true } })
  } else {
    const ids = JSON.parse(campaign.contactIds)
    contacts = await prisma.contact.findMany({
      where: { id: { in: ids }, teamId, isActive: true }
    })
  }

  // Trova quali contatti hanno già un messaggio per questa campagna (utile per il Resume)
  const existingMessages = await prisma.message.findMany({
    where: { campaignId },
    select: { contactId: true }
  })
  const processedContactIds = new Set(existingMessages.map(m => m.contactId))
  const remainingContacts = contacts.filter(c => !processedContactIds.has(c.id))

  if (remainingContacts.length === 0) {
    // Già finita
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'COMPLETED', completedAt: new Date() }
    })
    return
  }

  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: 'RUNNING',
      totalCount: contacts.length,
      startedAt: campaign.startedAt || new Date()
    }
  })

  // Calcola i delay incrementali (Jitter Anti-Ban)
  const delayMin = campaign.delayMin * 1000
  const delayMax = campaign.delayMax * 1000
  let cumulativeDelay = 0

  const jobs = remainingContacts.map(contact => {
    const jitter = delayMin + Math.random() * (delayMax - delayMin)
    cumulativeDelay += jitter
    return {
      name: 'send-message',
      data: { campaignId, contactId: contact.id, teamId },
      opts: { delay: Math.floor(cumulativeDelay) }
    }
  })

  // Inserisci in BullMQ (li schedula tutti nel futuro in base al delay!)
  await campaignQueue.addBulk(jobs)
}

export async function pauseCampaign(campaignId: string, teamId: string) {
  await prisma.campaign.update({
    where: { id: campaignId, teamId },
    data: { status: 'PAUSED' }
  })
  // I job pendenti in BullMQ per questa campagna torneranno skipped (Campaign not running).
  // Quando verrà richiamato startCampaign(), ricalcoleremo quelli mancanti e li rimetteremo in coda.
  return true
}

export async function getCampaignProgress(campaignId: string, teamId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId, teamId }
  })
  if (!campaign) return null

  const progress = campaign.totalCount > 0
    ? Math.round(((campaign.sentCount + campaign.failedCount) / campaign.totalCount) * 100)
    : 0


  return { ...campaign, progress, isActive: campaign.status === 'RUNNING' }
}

export async function startVerificationJob(teamId: string, contactIds?: string[]) {
  let contacts
  if (contactIds && contactIds.length > 0) {
    contacts = await prisma.contact.findMany({ where: { id: { in: contactIds }, teamId } })
  } else {
    // Verify only unverified ones
    contacts = await prisma.contact.findMany({ where: { teamId, isOnWhatsApp: null } })
  }

  const jobs = contacts.map(c => ({
    name: 'verify-contact',
    data: { contactId: c.id, teamId, phone: c.fullPhone }
  }))

  await verifyQueue.addBulk(jobs)
  return jobs.length
}
