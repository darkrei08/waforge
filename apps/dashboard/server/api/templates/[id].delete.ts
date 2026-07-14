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

  const campaignsUsingTemplate = await prisma.campaign.findMany({
    where: { templateId: id },
    select: { name: true }
  })

  if (campaignsUsingTemplate.length > 0) {
    const campaignNames = campaignsUsingTemplate.map(c => c.name).join(', ')
    throw createError({ 
      statusCode: 400, 
      statusMessage: `Impossibile eliminare: il template è in uso nelle campagne: ${campaignNames}` 
    })
  }

  await prisma.template.delete({ where: { id } })

  return { success: true }
})
