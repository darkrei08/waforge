/**
 * POST /api/contacts/import — Import contacts from CSV
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { zodReadBody } from '~/server/utils/validation'
import { BulkImportSchema } from '~/lib/validation'
import { parseCSV } from '~/lib/csv-parser'
import { securityLog } from '~/lib/security-logger'
import { checkPlanLimit, PLAN_LIMITS } from '~/server/utils/planLimits'

export default defineEventHandler(async (event) => {
  const { csv, groupId } = await zodReadBody(event, BulkImportSchema)
  const teamId = event.context.user.teamId

  await checkPlanLimit(teamId, 'contacts')

  const team = await prisma.team.findUnique({ where: { id: teamId }, select: { planTier: true } })
  const tier = team?.planTier || 'FREE'
  const limit = PLAN_LIMITS[tier]?.contacts ?? 0
  const currentCount = await prisma.contact.count({ where: { teamId } })

  const result = parseCSV(csv)

  let imported = 0
  let skipped = 0

  for (const contact of result.contacts) {
    if (limit !== -1 && (currentCount + imported) >= limit) {
      break // Fermati se raggiungi il limite durante l'import
    }
    try {
      await prisma.contact.upsert({
        where: { teamId_fullPhone: { teamId, fullPhone: contact.fullPhone } },
        create: {
          teamId,
          name: contact.name,
          prefix: contact.prefix,
          phone: contact.phone,
          fullPhone: contact.fullPhone,
          secondaryPhones: contact.secondaryPhones ? JSON.stringify(contact.secondaryPhones) : null,
          email: contact.email,
          company: contact.company,
          customFields: contact.customFields ? JSON.stringify(contact.customFields) : null,
          groups: groupId ? { connect: { id: groupId } } : undefined,
        },
        update: {
          name: contact.name,
          secondaryPhones: contact.secondaryPhones ? JSON.stringify(contact.secondaryPhones) : undefined,
          email: contact.email,
          company: contact.company,
          customFields: contact.customFields ? JSON.stringify(contact.customFields) : null,
          groups: groupId ? { connect: { id: groupId } } : undefined,
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
