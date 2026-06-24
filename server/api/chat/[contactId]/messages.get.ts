import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/chat/[contactId]/messages — Get chat history for a specific contact
 */
export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  const contactId = event.context.params?.contactId

  if (!contactId) return { error: 'Contact ID required' }

  // Verify contact belongs to team
  const contact = await prisma.contact.findUnique({
    where: { id: contactId, teamId }
  })

  if (!contact) {
    throw createError({ statusCode: 404, statusMessage: 'Contact not found' })
  }

  const messages = await prisma.chatMessage.findMany({
    where: { contactId, teamId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, name: true } }
    }
  })

  return { data: messages }
})
