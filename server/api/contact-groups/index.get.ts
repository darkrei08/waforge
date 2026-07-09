import { prisma } from '~/server/utils/prisma'
import { requireAuth } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const { teamId } = await requireAuth(event)

  try {
    const groups = await prisma.contactGroup.findMany({
      where: { teamId },
      include: {
        _count: {
          select: { contacts: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    return { success: true, data: groups }
  } catch (error: any) {
    return createError({ statusCode: 500, message: error.message })
  }
})
