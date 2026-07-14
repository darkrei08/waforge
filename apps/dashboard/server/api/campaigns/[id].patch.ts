import { z } from 'zod'
import { prisma } from '~/server/utils/prisma'
import { broadcastToTeam } from '~/server/routes/ws'

const updateCampaignSchema = z.object({
  name: z.string().optional(),
  templateId: z.string().optional(),
  delayMin: z.number().min(1).optional(),
  delayMax: z.number().min(1).optional(),
  scheduledAt: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, message: 'ID required' })

  const body = await readBody(event)
  const parsed = updateCampaignSchema.parse(body)

  // Verify ownership and status
  const existing = await prisma.campaign.findUnique({
    where: { id, teamId: user.teamId }
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Campaign not found' })
  }
  
  if (existing.status === 'RUNNING') {
    throw createError({ statusCode: 400, message: 'Cannot modify a running campaign' })
  }

  // If they are not in DRAFT, they can only reschedule (change scheduledAt).
  if (existing.status !== 'DRAFT' && (!parsed.scheduledAt || Object.keys(parsed).some(k => k !== 'scheduledAt' && (parsed as any)[k] !== undefined))) {
    // We allow only scheduledAt to be updated if not DRAFT (and possibly we should just ignore other fields, but let's allow partial updates)
    // Actually, just let them reschedule. If they provide scheduledAt, we change status to SCHEDULED.
  }

  let newStatus = existing.status
  let dataToUpdate: any = { ...parsed }
  
  if (parsed.scheduledAt) {
    newStatus = 'SCHEDULED'
    dataToUpdate.status = newStatus
    
    if (existing.status !== 'DRAFT') {
      // If we are rescheduling a non-draft campaign, we reset its state
      // so it can send messages again from scratch.
      await prisma.message.deleteMany({
        where: { campaignId: id }
      })
      dataToUpdate.sentCount = 0
      dataToUpdate.failedCount = 0
      dataToUpdate.startedAt = null
      dataToUpdate.completedAt = null
    }
  }

  const updated = await prisma.campaign.update({
    where: { id, teamId: user.teamId },
    data: dataToUpdate
  })

  broadcastToTeam(user.teamId, 'campaign_updated', updated)

  return { success: true, data: updated }
})
