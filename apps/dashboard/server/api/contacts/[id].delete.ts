/**
 * DELETE /api/contacts/:id — Delete a contact
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing contact ID' })
  const teamId = event.context.user.teamId

  const existing = await prisma.contact.findFirst({ where: { id, teamId } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Contact not found' })

  await prisma.contact.delete({ where: { id } })

  return { success: true }
})
