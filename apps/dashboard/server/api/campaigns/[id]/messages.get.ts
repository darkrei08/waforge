/**
 * GET /api/campaigns/[id]/messages — Get detailed logs of messages sent in a campaign
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const campaignId = event.context.params?.id
  const teamId = event.context.user.teamId

  if (!campaignId) {
    throw createError({ statusCode: 400, message: 'Campaign ID required' })
  }

  // Ensure campaign belongs to team
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId, teamId }
  })

  if (!campaign) {
    throw createError({ statusCode: 404, message: 'Campaign not found' })
  }

  const messages = await prisma.message.findMany({
    where: { campaignId },
    include: {
      contact: {
        select: { name: true, fullPhone: true, consentStatus: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return { data: messages }
})
