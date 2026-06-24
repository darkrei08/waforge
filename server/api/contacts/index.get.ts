/**
 * GET /api/contacts — List contacts with pagination & search
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { readValidatedQuery } from '~/server/utils/validation'
import { PaginationSchema } from '~/lib/validation'

export default defineEventHandler(async (event) => {
  const { page, limit, search } = readValidatedQuery(event, PaginationSchema)
  const teamId = event.context.user.teamId

  const where = search
    ? {
        teamId,
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { fullPhone: { contains: search } },
          { email: { contains: search } },
          { company: { contains: search } },
        ],
      }
    : { teamId }

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.contact.count({ where }),
  ])

  return {
    data: contacts,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
})
