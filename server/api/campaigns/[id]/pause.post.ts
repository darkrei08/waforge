/**
 * POST /api/campaigns/:id/pause — Pause a running campaign
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { pauseCampaign } from '~/server/utils/job-queue'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing campaign ID' })
  const teamId = event.context.user.teamId

  // Verify access
  const campaign = await prisma.campaign.findFirst({ where: { id, teamId } })
  if (!campaign) throw createError({ statusCode: 404, statusMessage: 'Campaign not found or access denied' })

  const paused = pauseCampaign(id)

  if (!paused) {
    throw createError({ statusCode: 404, statusMessage: 'No active campaign with this ID' })
  }

  return { success: true, message: 'Campaign paused' }
})
