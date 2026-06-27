/**
 * GET /api/contacts/export — Export contacts to CSV
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { generateCSV } from '~/lib/csv-parser'
import { zodReadQuery } from '~/server/utils/validation'
import { z } from 'zod'

const ExportQuerySchema = z.object({
  search: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const { search } = await zodReadQuery(event, ExportQuerySchema)
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

  const contacts = await prisma.contact.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })

  const csv = generateCSV(contacts)

  // Set headers to trigger a file download
  setResponseHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setResponseHeader(event, 'Content-Disposition', 'attachment; filename="contacts_export.csv"')

  return csv
})
