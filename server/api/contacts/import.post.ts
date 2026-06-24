/**
 * POST /api/contacts/import — Import contacts from CSV
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { readValidatedBody } from '~/server/utils/validation'
import { BulkImportSchema } from '~/lib/validation'
import { parseCSV } from '~/lib/csv-parser'
import { securityLog } from '~/lib/security-logger'

export default defineEventHandler(async (event) => {
  const { csv } = await readValidatedBody(event, BulkImportSchema)
  const teamId = event.context.user.teamId

  const result = parseCSV(csv)

  let imported = 0
  let skipped = 0

  for (const contact of result.contacts) {
    try {
      await prisma.contact.upsert({
        where: { teamId_fullPhone: { teamId, fullPhone: contact.fullPhone } },
        create: {
          teamId,
          name: contact.name,
          prefix: contact.prefix,
          phone: contact.phone,
          fullPhone: contact.fullPhone,
          email: contact.email,
          company: contact.company,
          customFields: contact.customFields ? JSON.stringify(contact.customFields) : null,
        },
        update: {
          name: contact.name,
          email: contact.email,
          company: contact.company,
          customFields: contact.customFields ? JSON.stringify(contact.customFields) : null,
        },
      })
      imported++
    } catch {
      skipped++
    }
  }

  securityLog.campaignStarted(`csv-import-${Date.now()}`, imported)

  return {
    data: {
      imported,
      skipped,
      errors: result.errors,
      totalRows: result.totalRows,
    },
  }
})
