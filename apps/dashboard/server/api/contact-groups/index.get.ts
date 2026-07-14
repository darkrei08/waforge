import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId

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
    throw createError({ statusCode: 500, message: error.message })
  }
})
