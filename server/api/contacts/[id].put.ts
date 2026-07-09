/**
 * PUT /api/contacts/:id — Update a contact
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { zodReadBody } from '~/server/utils/validation'
import { UpdateContactSchema } from '~/lib/validation'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing contact ID' })
  const teamId = event.context.user.teamId

  const data = await zodReadBody(event, UpdateContactSchema)

  // Verify contact belongs to team
  const existing = await prisma.contact.findFirst({ where: { id, teamId } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Contact not found' })

  // Recompute fullPhone if prefix or phone changed
  const updateData: Record<string, unknown> = { ...data }
  if (data.prefix || data.phone) {
    const prefix = data.prefix || existing.prefix
    const phone = data.phone || existing.phone
    updateData.fullPhone = (prefix + phone).replace(/\D/g, '')
  }

  if (data.customFields) {
    updateData.customFields = JSON.stringify(data.customFields)
  }

  if (data.groupIds !== undefined) {
    updateData.groups = {
      set: data.groupIds.map(id => ({ id }))
    }
    delete updateData.groupIds
  }

  const contact = await prisma.contact.update({
    where: { id },
    data: updateData,
    include: {
      groups: true
    }
  })

  return { data: contact }
})
