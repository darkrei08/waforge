/**
 * GET /api/templates — List all templates
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId

  const templates = await prisma.template.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' },
  })
  return { data: templates }
})
