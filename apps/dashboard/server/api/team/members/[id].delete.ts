import { defineEventHandler, createError, getRouterParam } from 'h3'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = event.context.user
  if (!authUser) throw createError({ statusCode: 401, message: 'Unauthorized' })

  if (authUser.role !== 'OWNER' && authUser.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const membershipId = getRouterParam(event, 'id')
  if (!membershipId) throw createError({ statusCode: 400, message: 'ID required' })

  const membership = await prisma.teamMembership.findUnique({
    where: { id: membershipId }
  })

  if (!membership || membership.teamId !== authUser.teamId) {
    throw createError({ statusCode: 404, message: 'Membership not found' })
  }

  // Prevent deleting oneself
  if (membership.userId === authUser.userId) {
    throw createError({ statusCode: 400, message: 'Cannot remove yourself' })
  }

  await prisma.teamMembership.delete({
    where: { id: membershipId }
  })

  return { success: true, message: 'Member removed successfully' }
})
