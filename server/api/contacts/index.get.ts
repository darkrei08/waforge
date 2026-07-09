/**
 * GET /api/contacts — List contacts with pagination & search
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { zodReadQuery } from '~/server/utils/validation'
import { PaginationSchema } from '~/lib/validation'

export default defineEventHandler(async (event) => {
  const { page, limit, search, groupId } = zodReadQuery(event, PaginationSchema)
  const teamId = event.context.user.teamId

  const baseWhere: any = { teamId }
  if (groupId) {
    baseWhere.groups = {
      some: { id: groupId }
    }
  }

  const where = search
    ? {
        ...baseWhere,
        OR: [
          { name: { contains: search } },
          { phone: { contains: search } },
          { fullPhone: { contains: search } },
          { email: { contains: search } },
          { company: { contains: search } },
        ],
      }
    : baseWhere

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        groups: true
      }
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
