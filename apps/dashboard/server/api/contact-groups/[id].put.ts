import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  tags: z.string().optional().nullable(),
  color: z.string().optional().nullable()
})

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  const id = event.context.params?.id

  if (!id) {
    throw createError({ statusCode: 400, message: 'ID mancante.' })
  }

  const body = await readBody(event)
  const parsed = updateSchema.safeParse(body)
  
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Dati non validi.', data: parsed.error })
  }

  // Ensure it belongs to team
  const group = await prisma.contactGroup.findFirst({
    where: { id, teamId }
  })

  if (!group) {
    throw createError({ statusCode: 404, message: 'Rubrica non trovata.' })
  }

  if (parsed.data.name && parsed.data.name !== group.name) {
    const exists = await prisma.contactGroup.findFirst({
      where: { teamId, name: parsed.data.name }
    })
    if (exists) {
      throw createError({ statusCode: 409, message: 'Esiste già una rubrica con questo nome.' })
    }
  }

  const dataToUpdate: any = {}
  if (parsed.data.name !== undefined) dataToUpdate.name = parsed.data.name
  if (parsed.data.description !== undefined) dataToUpdate.description = parsed.data.description
  if (parsed.data.tags !== undefined) dataToUpdate.tags = parsed.data.tags
  if (parsed.data.color !== undefined) dataToUpdate.color = parsed.data.color

  const updated = await prisma.contactGroup.update({
    where: { id },
    data: dataToUpdate
  })

  return updated
})
