/**
 * POST /api/campaigns/:id/start — Start or resume a campaign
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { startCampaign } from '~/server/utils/job-queue'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing campaign ID' })
  const teamId = event.context.user.teamId

  // Verify access
  const campaign = await prisma.campaign.findFirst({ where: { id, teamId } })
  if (!campaign) throw createError({ statusCode: 404, statusMessage: 'Campaign not found or access denied' })

  // Start in background (non-blocking)
  startCampaign(id).catch(err => {
    console.error(`[Campaign ${id}] Error:`, err)
  })

  return { success: true, message: 'Campaign started' }
})
