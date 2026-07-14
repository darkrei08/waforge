import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const user = event.context.user
  if (!user) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400, message: 'ID required' })

  // Verify ownership and status
  const existing = await prisma.campaign.findUnique({
    where: { id, teamId: user.teamId }
  })

  if (!existing) {
    throw createError({ statusCode: 404, message: 'Campaign not found' })
  }
  
  if (existing.status === 'RUNNING') {
    throw createError({ statusCode: 400, message: 'Cannot delete a running campaign' })
  }

  // Delete all associated messages first (if not cascading)
  await prisma.message.deleteMany({
    where: { campaignId: id }
  })

  await prisma.campaign.delete({
    where: { id, teamId: user.teamId }
  })

  return { success: true }
})
