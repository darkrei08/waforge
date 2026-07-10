import { defineEventHandler, readBody } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { sendMessage } from '~/lib/whatsapp-engine'
import { broadcastToTeam } from '~/server/routes/ws'

/**
 * POST /api/chat/send — Send a manual message from an agent
 */
export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  const userId = event.context.user.id
  const body = await readBody(event)
  const { contactId, text } = body

  if (!contactId || !text) {
    throw createError({ statusCode: 400, statusMessage: 'Contact ID and text required' })
  }

  const contact = await prisma.contact.findUnique({
    where: { id: contactId, teamId }
  })

  if (!contact) {
    throw createError({ statusCode: 404, statusMessage: 'Contact not found' })
  }

  // Get WhatsApp session
  const session = await prisma.whatsAppSession.findFirst({ where: { teamId } })
  if (!session || !session.token) {
    throw createError({ statusCode: 400, statusMessage: 'WhatsApp Session not connected for team' })
  }

  // Call WhatsApp Engine
  const result = await sendMessage(session.token, contact.fullPhone, text)

  // Find or create Conversation
  let conversation = await prisma.whatsAppConversation.findUnique({
    where: { teamId_contactId: { teamId, contactId: contact.id } }
  })
  if (!conversation) {
    conversation = await prisma.whatsAppConversation.create({
      data: { teamId, contactId: contact.id }
    })
  }

  // Save OUTBOUND message
  const chatMsg = await prisma.chatMessage.create({
    data: {
      teamId,
      contactId: contact.id,
      conversationId: conversation.id,
      direction: 'OUTBOUND',
      content: text,
      wuzapiMsgId: result.messageId || null,
      status: result.success ? 'SENT' : 'FAILED',
      senderId: userId,
    },
    include: { sender: { select: { name: true } } }
  })

  // Update conversation (reset unread since agent replied)
  await prisma.whatsAppConversation.update({
    where: { id: conversation.id },
    data: {
      unreadCount: 0,
      lastMessageAt: new Date()
    }
  })

  // Broadcast to other connected team members
  broadcastToTeam(teamId, 'new_message', chatMsg)

  return { success: result.success, data: chatMsg, error: result.error }
})
