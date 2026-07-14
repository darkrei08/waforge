/**
 * POST /api/campaigns — Create a new campaign
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { zodReadBody } from '~/server/utils/validation'
import { CreateCampaignSchema } from '~/lib/validation'

export default defineEventHandler(async (event) => {
  const data = await zodReadBody(event, CreateCampaignSchema)
  const teamId = event.context.user.teamId

  // Verify template belongs to team
  const template = await prisma.template.findFirst({ where: { id: data.templateId, teamId } })
  if (!template) throw createError({ statusCode: 404, statusMessage: 'Template not found or access denied' })

  const campaign = await prisma.campaign.create({
    data: {
      teamId,
      name: data.name,
      templateId: data.templateId,
      contactIds: Array.isArray(data.contactIds)
        ? JSON.stringify(data.contactIds)
        : data.contactIds,
      delayMin: data.delayMin,
      delayMax: data.delayMax,
      includeGdprDisclaimer: data.includeGdprDisclaimer,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      status: data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
    },
    include: { template: { select: { name: true } } },
  })

  return { data: campaign }
})
