/**
 * DELETE /api/templates/:id — Delete a template
 */

import { defineEventHandler, getRouterParam, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Missing template ID' })
  const teamId = event.context.user.teamId

  const existing = await prisma.template.findFirst({ where: { id, teamId } })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'Template not found or access denied' })

  await prisma.template.delete({ where: { id } })

  return { success: true }
})
