import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = event.context.user
  if (!authUser) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, message: 'Device ID is required' })

  const body = await readBody(event)
  const { name, tags, description } = body

  // Check if session belongs to the user's team
  const session = await prisma.whatsAppSession.findFirst({
    where: { id, teamId: authUser.teamId }
  })

  if (!session) {
    throw createError({ statusCode: 404, message: 'Device not found' })
  }

  // Update session
  const updated = await prisma.whatsAppSession.update({
    where: { id },
    data: {
      name: name !== undefined ? name : session.name,
      tags: tags !== undefined ? tags : session.tags,
      description: description !== undefined ? description : session.description,
    }
  })

  return { success: true, data: updated }
})
