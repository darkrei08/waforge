/**
 * POST /api/contacts — Create a new contact
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { readValidatedBody } from '~/server/utils/validation'
import { CreateContactSchema } from '~/lib/validation'

export default defineEventHandler(async (event) => {
  const data = await readValidatedBody(event, CreateContactSchema)
  const teamId = event.context.user.teamId

  const fullPhone = (data.prefix + data.phone).replace(/\D/g, '')

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
    },
  })

  return { data: contact }
})
