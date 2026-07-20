/**
 * Campaign API Routes — CRUD + Start/Pause/Status/Stream
 * Mounted under /wa/campaigns
 */
import { Elysia, t } from 'elysia'
import { PrismaClient } from '@waforge/database'
import { startCampaign, pauseCampaign, getCampaignProgress } from './worker'
import { campaignQueue } from '../utils/redis'

const prisma = new PrismaClient()

export const campaignRoutes = new Elysia({ prefix: '/campaigns' })

  // List campaigns
  .get('/', async ({ query, tenantId }) => {
    const teamId = tenantId
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 25
    const search = query.search as string | undefined

    const where = search ? { teamId, name: { contains: search } } : { teamId }
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({ where, include: { template: { select: { name: true } } }, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.campaign.count({ where }),
    ])
    return { data: campaigns, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  })

  // Get single campaign
  .get('/:id', async ({ params, tenantId }) => {
    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, teamId: tenantId },
      include: { template: true, messages: { take: 50, orderBy: { createdAt: 'desc' }, include: { contact: { select: { name: true, fullPhone: true } } } } }
    })
    if (!campaign) throw new Error('Campaign not found')
    return { data: campaign }
  })

  // Create campaign
  .post('/', async ({ body, tenantId }) => {
    const template = await prisma.template.findFirst({ where: { id: body.templateId, teamId: tenantId } })
    if (!template) throw new Error('Template not found or access denied')

    const campaign = await prisma.campaign.create({
      data: {
        teamId: tenantId,
        name: body.name,
        templateId: body.templateId,
        contactIds: Array.isArray(body.contactIds) ? JSON.stringify(body.contactIds) : body.contactIds || 'ALL',
        delayMin: body.delayMin || 15,
        delayMax: body.delayMax || 45,
        includeGdprDisclaimer: body.includeGdprDisclaimer || false,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: body.scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
      include: { template: { select: { name: true } } },
    })
    return { data: campaign }
  }, {
    body: t.Object({
      name: t.String(),
      templateId: t.String(),
      contactIds: t.Optional(t.Union([t.Array(t.String()), t.String()])),
      delayMin: t.Optional(t.Number()),
      delayMax: t.Optional(t.Number()),
      includeGdprDisclaimer: t.Optional(t.Boolean()),
      scheduledAt: t.Optional(t.Union([t.String(), t.Null()])),
    })
  })

  // Update campaign
  .patch('/:id', async ({ params, body, tenantId }) => {
    const existing = await prisma.campaign.findUnique({ where: { id: params.id, teamId: tenantId } })
    if (!existing) throw new Error('Campaign not found')
    if (existing.status === 'RUNNING') throw new Error('Cannot modify a running campaign')

    const dataToUpdate: any = { ...body }
    if (body.scheduledAt) {
      dataToUpdate.status = 'SCHEDULED'
      if (existing.status !== 'DRAFT') {
        await prisma.message.deleteMany({ where: { campaignId: params.id } })
        dataToUpdate.sentCount = 0; dataToUpdate.failedCount = 0; dataToUpdate.startedAt = null; dataToUpdate.completedAt = null
      }
    }

    const updated = await prisma.campaign.update({ where: { id: params.id, teamId: tenantId }, data: dataToUpdate })
    return { success: true, data: updated }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      templateId: t.Optional(t.String()),
      delayMin: t.Optional(t.Number()),
      delayMax: t.Optional(t.Number()),
      scheduledAt: t.Optional(t.Union([t.String(), t.Null()])),
    })
  })

  // Delete campaign
  .delete('/:id', async ({ params, tenantId }) => {
    const existing = await prisma.campaign.findUnique({ where: { id: params.id, teamId: tenantId } })
    if (!existing) throw new Error('Campaign not found')
    if (existing.status === 'RUNNING') throw new Error('Cannot delete a running campaign')
    await prisma.message.deleteMany({ where: { campaignId: params.id } })
    await prisma.campaign.delete({ where: { id: params.id, teamId: tenantId } })
    return { success: true }
  })

  // Bulk delete
  .post('/bulk-delete', async ({ body, tenantId }) => {
    await prisma.campaign.deleteMany({ where: { id: { in: body.ids }, teamId: tenantId } })
    return { success: true }
  }, {
    body: t.Object({ ids: t.Array(t.String()) })
  })

  // Start campaign
  .post('/:id/start', async ({ params, tenantId }) => {
    const campaign = await prisma.campaign.findFirst({ where: { id: params.id, teamId: tenantId } })
    if (!campaign) throw new Error('Campaign not found or access denied')
    await startCampaign(params.id, tenantId).catch(err => console.error(`[Campaign ${params.id}] Error:`, err))
    return { success: true, message: 'Campaign started' }
  })

  // Pause campaign
  .post('/:id/pause', async ({ params, tenantId }) => {
    const campaign = await prisma.campaign.findFirst({ where: { id: params.id, teamId: tenantId } })
    if (!campaign) throw new Error('Campaign not found or access denied')
    const paused = await pauseCampaign(params.id, tenantId)
    if (!paused) throw new Error('No active campaign with this ID')
    return { success: true, message: 'Campaign paused' }
  })

  // Campaign status
  .get('/:id/status', async ({ params, tenantId }) => {
    const progress = await getCampaignProgress(params.id, tenantId)
    if (!progress) throw new Error('Campaign not found')
    return { data: progress }
  })

  // Campaign messages log
  .get('/:id/messages', async ({ params, tenantId }) => {
    const campaign = await prisma.campaign.findUnique({ where: { id: params.id, teamId: tenantId } })
    if (!campaign) throw new Error('Campaign not found')
    const messages = await prisma.message.findMany({
      where: { campaignId: params.id },
      include: { contact: { select: { name: true, fullPhone: true, consentStatus: true } } },
      orderBy: { createdAt: 'desc' }
    })
    return { data: messages }
  })

  // SSE stream for real-time progress
  .get('/:id/stream', async ({ params, tenantId, set }) => {
    const campaign = await prisma.campaign.findFirst({ where: { id: params.id, teamId: tenantId } })
    if (!campaign) { set.status = 404; throw new Error('Campaign not found') }

    set.headers['Content-Type'] = 'text/event-stream'
    set.headers['Cache-Control'] = 'no-cache'
    set.headers['Connection'] = 'keep-alive'
    set.headers['X-Accel-Buffering'] = 'no'

    const id = params.id

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        let isClosed = false

        const sendProgress = async () => {
          if (isClosed) return

          const [c, activeJobs, waitingJobs] = await Promise.all([
            prisma.campaign.findUnique({ where: { id }, select: { status: true, totalCount: true, sentCount: true, failedCount: true } }),
            campaignQueue.getActive(),
            campaignQueue.getWaiting()
          ])
          if (!c) return

          const isActive = activeJobs.some(j => j.data.campaignId === id) || waitingJobs.some(j => j.data.campaignId === id)
          const progress = c.totalCount > 0 ? Math.round(((c.sentCount + c.failedCount) / c.totalCount) * 100) : 0
          const data = JSON.stringify({ id, status: c.status, totalCount: c.totalCount, sentCount: c.sentCount, failedCount: c.failedCount, progress, isActive })

          controller.enqueue(encoder.encode(`data: ${data}\n\n`))

          if (!isActive && c.status !== 'RUNNING') {
            controller.enqueue(encoder.encode('event: close\ndata: {}\n\n'))
            isClosed = true
            controller.close()
          }
        }

        await sendProgress()
        const interval = setInterval(async () => {
          if (isClosed) { clearInterval(interval); return }
          await sendProgress()
        }, 2000)
      }
    })

    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } })
  })
