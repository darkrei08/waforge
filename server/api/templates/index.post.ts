/**
 * POST /api/templates — Create a new template
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { readValidatedBody } from '~/server/utils/validation'
import { CreateTemplateSchema } from '~/lib/validation'

export default defineEventHandler(async (event) => {
  const data = await readValidatedBody(event, CreateTemplateSchema)
  const teamId = event.context.user.teamId

  const template = await prisma.template.create({ data: { ...data, teamId } })

  return { data: template }
})
