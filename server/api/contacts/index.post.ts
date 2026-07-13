/**
 * POST /api/contacts — Create a new contact
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { zodReadBody } from '~/server/utils/validation'
import { CreateContactSchema } from '~/lib/validation'
import parsePhoneNumber from 'libphonenumber-js'

export default defineEventHandler(async (event) => {
  const data = await zodReadBody(event, CreateContactSchema)
  const teamId = event.context.user.teamId

  const parsed = parseAndCleanPhone(data.prefix + data.phone)
  const fullPhone = parsed.fullPhone || (data.prefix + data.phone).replace(/\D/g, '')
  const formattedPrefix = parsed.prefix || data.prefix
  const formattedPhone = parsed.phone || data.phone

  const contact = await prisma.contact.create({
    data: {
      teamId,
      name: data.name,
      prefix: data.prefix,
      phone: data.phone,
      fullPhone,
      email: data.email,
      company: data.company,
      notes: data.notes,
      customFields: data.customFields ? JSON.stringify(data.customFields) : null,
      source: data.source || 'manual',
      labels: data.labels ? JSON.stringify(data.labels) : null,
      secondaryPhones: data.secondaryPhones ? JSON.stringify(data.secondaryPhones) : null,
      pec: data.pec || null,
      declarantName: data.declarantName || null,
      declarantPhone: data.declarantPhone || null,
      ...(data.groupIds?.length ? {
        groups: {
          connect: data.groupIds.map(id => ({ id }))
        }
      } : {})
    },
    include: {
      groups: true
    }
  })

  return { data: contact }
})
