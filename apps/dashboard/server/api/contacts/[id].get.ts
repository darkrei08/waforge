/**
 * GET /api/contacts/:id — Get a single contact
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing contact ID' })
  const teamId = event.context.user.teamId

  const contact = await prisma.contact.findFirst({
    where: { id, teamId },
    include: {
      messages: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!contact) {
    throw createError({ statusCode: 404, statusMessage: 'Contact not found' })
  }

  return { data: contact }
})
