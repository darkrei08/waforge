/**
 * GET /api/campaigns/:id/status — Get real-time campaign progress
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { getCampaignProgress } from '~/server/utils/job-queue'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing campaign ID' })
  const teamId = event.context.user.teamId

  // Verify access
  const campaign = await prisma.campaign.findFirst({ where: { id, teamId } })
  if (!campaign) throw createError({ statusCode: 404, statusMessage: 'Campaign not found or access denied' })

  const progress = await getCampaignProgress(id)

  if (!progress) {
    throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })
  }

  return { data: progress }
})
