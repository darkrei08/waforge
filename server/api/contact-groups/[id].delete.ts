import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { teamId } = await requireAuth(event)
  const groupId = getRouterParam(event, 'id')

  if (!groupId) {
    return createError({ statusCode: 400, message: 'Group ID is required' })
  }

  try {
    // Verify ownership
    const group = await prisma.contactGroup.findUnique({
      where: { id: groupId }
    })

    if (!group || group.teamId !== teamId) {
      return createError({ statusCode: 404, message: 'Group not found' })
    }

    await prisma.contactGroup.delete({
      where: { id: groupId }
    })

    return { success: true, message: 'Group deleted successfully' }
  } catch (error: any) {
    return createError({ statusCode: 500, message: error.message })
  }
})
