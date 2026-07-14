import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = event.context.user
  if (!authUser) throw createError({ statusCode: 401, message: 'Unauthorized' })

  // Verify the user is an ADMIN or OWNER of the team
  const membership = await prisma.teamMembership.findUnique({
    where: { userId_teamId: { userId: authUser.userId, teamId: authUser.teamId } }
  })
  if (!membership || (membership.role !== 'ADMIN' && membership.role !== 'OWNER')) {
    throw createError({ statusCode: 403, message: 'Forbidden: Admin only' })
  }

  const body = await readBody(event)
  const { name, description, tags } = body

  if (!name || name.trim().length === 0) {
    throw createError({ statusCode: 400, message: 'Team name is required' })
  }

  const updatedTeam = await prisma.team.update({
    where: { id: authUser.teamId },
    data: {
      name: name.trim(),
      description: description,
      tags: tags
    }
  })

  return { success: true, team: updatedTeam }
})
