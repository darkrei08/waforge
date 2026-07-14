import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = event.context.user
  if (!authUser) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const team = await prisma.team.findUnique({
    where: { id: authUser.teamId }
  })

  if (!team) {
    throw createError({ statusCode: 404, message: 'Team not found' })
  }

  return { success: true, team }
})
