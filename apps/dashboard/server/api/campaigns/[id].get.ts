/**
 * GET /api/campaigns/:id — Get a single campaign with messages
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing campaign ID' })
  const teamId = event.context.user.teamId

  const campaign = await prisma.campaign.findFirst({
    where: { id, teamId },
    include: {
      template: true,
      messages: {
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: { contact: { select: { name: true, fullPhone: true } } },
      },
    },
  })

  if (!campaign) {
    throw createError({ statusCode: 404, statusMessage: 'Campaign not found' })
  }

  return { data: campaign }
})
