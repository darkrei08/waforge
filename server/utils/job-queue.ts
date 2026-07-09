import { Queue, Worker, Job } from 'bullmq'
import IORedis from 'ioredis'
import { prisma } from './prisma'
import { sendMessage, sendMedia, renderTemplate, checkPhone, sendPresence } from '~/lib/whatsapp-engine'
import { expandSpintax } from '~/lib/spintax'

// ── ANTI-BAN: Costanti e configurazione ──────────────────────────────────────

/** Max messaggi giornalieri per singolo team (oltre questo, la campagna va in pausa automatica) */
const DAILY_SEND_CAP = 200

/** Ore di attività consentite (UTC). Fuori da questo range i job vengono rischedulati. */
const BUSINESS_HOURS = { start: 7, end: 22 } // 07:00 – 22:00 UTC

/** Genera un numero random con distribuzione gaussiana (Box-Muller). */
function gaussianRandom(mean: number, stddev: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z = Math.sqrt(-2.0 * Math.log(u1 || 0.0001)) * Math.cos(2.0 * Math.PI * u2)
  return Math.max(0, mean + z * stddev)
}

/** Controlla se siamo in orario di invio "umano" */
function isBusinessHours(): boolean {
  const hour = new Date().getUTCHours()
  return hour >= BUSINESS_HOURS.start && hour < BUSINESS_HOURS.end
}

/** Conta i messaggi inviati oggi da un team (Redis counter con TTL a mezzanotte) */
async function getDailySendCount(teamId: string): Promise<number> {
  const key = `antiban:daily:${teamId}:${new Date().toISOString().slice(0, 10)}`
  const count = await connection.get(key)
  return parseInt(count || '0', 10)
}

async function incrementDailySendCount(teamId: string): Promise<void> {
  const key = `antiban:daily:${teamId}:${new Date().toISOString().slice(0, 10)}`
  const multi = connection.multi()
  multi.incr(key)
  multi.expire(key, 86400) // TTL 24h
  await multi.exec()
}

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

export const campaignQueue = globalThis.__campaignQueue || new Queue('campaigns', { 
  connection: connection as any,
  defaultJobOptions: {
    removeOnComplete: true, // Cleanup successful jobs
    removeOnFail: 1000 // Keep last 1000 failed jobs for debugging
  }
})
if (process.env.NODE_ENV !== 'production') globalThis.__campaignQueue = campaignQueue

export const verifyQueue = globalThis.__verifyQueue || new Queue('verifications', { connection: connection as any })
if (process.env.NODE_ENV !== 'production') globalThis.__verifyQueue = verifyQueue

// ── Worker (Processore in Background) ────────────────────────────────────────

export const campaignWorker = globalThis.__campaignWorker || new Worker('campaigns', async (job: Job) => {
  const { campaignId, contactId, teamId } = job.data

  // ── ANTI-BAN: Business Hours Guard ──
  // Non inviare fuori dall'orario lavorativo: rischedula il job a +30min
  if (!isBusinessHours()) {
    // Rimetti in coda con delay di 30 minuti
    await campaignQueue.add('send-message', job.data, { delay: 30 * 60 * 1000 })
    return { skipped: true, reason: 'Outside business hours, rescheduled' }
  }

  // ── ANTI-BAN: Daily Send Cap ──
  const dailyCount = await getDailySendCount(teamId)
  if (dailyCount >= DAILY_SEND_CAP) {
    // Metti in pausa automatica la campagna
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' }
    })
    console.warn(`[ANTI-BAN] Team ${teamId} hit daily cap (${DAILY_SEND_CAP}). Campaign ${campaignId} auto-paused.`)
    return { skipped: true, reason: 'Daily send cap reached, campaign auto-paused' }
  }

  // Verifica che la campagna sia ancora in RUNNING
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: { template: true }
  })
  
  if (!campaign || campaign.status !== 'RUNNING') {
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

  // ── ANTI-BAN: Zero-Width Randomization ──
  // Caratteri invisibili alla fine per hash unico ogni volta
  const zwChars = ['\u200B', '\u200C', '\u200D', '\uFEFF']
  const zwCount = Math.floor(Math.random() * 6) + 3
  for (let i = 0; i < zwCount; i++) {
    body += zwChars[Math.floor(Math.random() * zwChars.length)]
  }

  // ── GDPR Disclaimer (Opt-Out) ──
  let gdprDisclaimerSent = false
  if (campaign.includeGdprDisclaimer && !contact.gdprNotified) {
    body += '\n\n*Ricevi questo messaggio perché hai prestato il consenso. Rispondi STOP in qualsiasi momento per disiscriverti.*'
    gdprDisclaimerSent = true
  }

  // ── ANTI-BAN: Typing Simulation ──
  // Simula "sta scrivendo..." prima dell'invio per sembrare umano
  await sendPresence(session.token, contact.fullPhone, body.length)

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

  // ── ANTI-BAN: Auto-Pause su errori 403 (ban/antifraud trigger) ──
  if (!result.success && result.error) {
    const errorStr = result.error.toLowerCase()
    const isBanSignal = errorStr.includes('403') 
      || errorStr.includes('fingerprint') 
      || errorStr.includes('blocked')
      || errorStr.includes('security policy')
      || errorStr.includes('too many')
      || errorStr.includes('invalid device')
      || errorStr.includes('invalid session')
    
    if (isBanSignal) {
      // EMERGENZA: pausa immediata di tutte le campagne del team
      await prisma.campaign.updateMany({
        where: { teamId, status: 'RUNNING' },
        data: { status: 'PAUSED' }
      })
      console.error(`[ANTI-BAN] 🚨 Ban signal detected for team ${teamId}: ${result.error}. ALL campaigns auto-paused.`)
    }
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

  // Aggiorna contatori live + daily cap Redis
  if (result.success) {
    await incrementDailySendCount(teamId)

    if (gdprDisclaimerSent) {
      await prisma.contact.update({
        where: { id: contactId },
        data: { gdprNotified: true }
      })
    }
  }
  await prisma.campaign.update({
    where: { id: campaignId },
    data: result.success 
      ? { sentCount: { increment: 1 } }
      : { failedCount: { increment: 1 } }
  })

  return { success: result.success, messageId: result.messageId }

}, { connection: connection as any, concurrency: 1 }) // ANTI-BAN: concurrency 1 — un messaggio alla volta, mai burst

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
  // ANTI-BAN: Escludiamo categoricamente quelli in cui sappiamo già isOnWhatsApp === false
  // Inviare messaggi a numeri invalidi è un trigger pesante per il ban Meta
  let contacts
  if (campaign.contactIds === 'ALL') {
    contacts = await prisma.contact.findMany({ 
      where: { 
        teamId, 
        isActive: true,
        isOnWhatsApp: { not: false }
      } 
    })
  } else {
    const parsedIds: string[] = JSON.parse(campaign.contactIds)
    const groupIds = parsedIds.filter(id => id.startsWith('GROUP:')).map(id => id.replace('GROUP:', ''))
    const explicitIds = parsedIds.filter(id => !id.startsWith('GROUP:'))

    const conditions: any[] = []
    if (explicitIds.length > 0) conditions.push({ id: { in: explicitIds } })
    if (groupIds.length > 0) conditions.push({ groups: { some: { id: { in: groupIds } } } })

    if (conditions.length > 0) {
      contacts = await prisma.contact.findMany({
        where: { 
          teamId, 
          isActive: true,
          isOnWhatsApp: { not: false },
          OR: conditions
        }
      })
    } else {
      contacts = []
    }
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

  // ── ANTI-BAN: Gaussian Jitter Scheduling ──
  // Forziamo ritardi sicuri (almeno 10s) e usiamo distribuzione gaussiana
  // per simulare comportamento umano non-uniforme
  const meanDelay = Math.max(10000, campaign.delayMin * 1000) // almeno 10s
  const stddev = Math.max(2000, (campaign.delayMax - campaign.delayMin) * 500) // deviazione standard

  let cumulativeDelay = 0

  const jobs = remainingContacts.map(contact => {
    // Gaussian jitter: varia naturalmente come un umano, non come un timer
    const jitter = Math.max(8000, gaussianRandom(meanDelay, stddev))
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
