/**
 * GET /api/campaigns — List all campaigns
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { zodReadQuery } from '~/server/utils/validation'
import { PaginationSchema } from '~/lib/validation'

export default defineEventHandler(async (event) => {
  const { page, limit, search } = zodReadQuery(event, PaginationSchema)
  const teamId = event.context.user.teamId

  const where = search
    ? { teamId, name: { contains: search } }
    : { teamId }

  const [campaigns, total] = await Promise.all([
    prisma.campaign.findMany({
      where,
      include: { template: { select: { name: true } } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.campaign.count({ where }),
  ])

  return {
    data: campaigns,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  }
})
