/**
 * POST /api/campaigns/bulk-delete — Delete multiple campaigns
 */

import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  const body = await readBody(event)

  if (!body.ids || !Array.isArray(body.ids)) {
    throw createError({ statusCode: 400, message: 'Invalid or missing ids array' })
  }

  // Ensure campaigns belong to the team and delete them
  // Messages and logs should be deleted automatically if CASCADE is configured in schema.
  await prisma.campaign.deleteMany({
    where: {
      id: { in: body.ids },
      teamId
    }
  })

  return { success: true }
})
