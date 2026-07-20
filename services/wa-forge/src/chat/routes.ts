/**
 * Live Chat Routes — Send/receive messages via WhatsApp
 * Mounted under /wa/chat (protected by JWT + Feature Guard)
 */
import { Elysia, t } from 'elysia'
import { PrismaClient } from '@waforge/database'
import { sendMessage, sendMedia } from '../utils/engines'
import { publishEvent } from '../utils/redis'

const prisma = new PrismaClient()

export const chatRoutes = new Elysia({ prefix: '/chat' })

  // List active conversations
  .get('/', async ({ tenantId }) => {
    const contactsWithChats = await prisma.contact.findMany({
      where: { teamId: tenantId, chatHistory: { some: {} } },
      include: { chatHistory: { orderBy: { createdAt: 'desc' }, take: 1 } }
    })

    const sorted = contactsWithChats.sort((a, b) => {
      const timeA = a.chatHistory[0]?.createdAt.getTime() || 0
      const timeB = b.chatHistory[0]?.createdAt.getTime() || 0
      return timeB - timeA
    })

    return {
      data: sorted.map(c => ({
        ...c,
        latestMessage: c.chatHistory[0] || null,
        chatHistory: undefined
      }))
    }
  })

  // Get messages for a contact
  .get('/:contactId/messages', async ({ params, tenantId, query }) => {
    const limit = Number(query.limit) || 50
    const messages = await prisma.chatMessage.findMany({
      where: { contactId: params.contactId, teamId: tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { sender: { select: { name: true } } }
    })
    return { data: messages }
  })

  // Send a manual message
  .post('/send', async ({ body, tenantId, userId }) => {
    const { contactId, text, mediaUrl, mediaType } = body
    if (!contactId || (!text && !mediaUrl)) throw new Error('Contact ID and text or media required')

    const contact = await prisma.contact.findUnique({ where: { id: contactId, teamId: tenantId } })
    if (!contact) throw new Error('Contact not found')

    const session = await prisma.whatsAppSession.findFirst({ where: { teamId: tenantId } })
    if (!session || !session.token) throw new Error('WhatsApp Session not connected')

    let result
    let effectiveMediaType = mediaType || 'text'
    if (mediaUrl && effectiveMediaType === 'text') {
      const ext = mediaUrl.split('.').pop()?.toLowerCase() || ''
      if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) effectiveMediaType = 'image'
      else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) effectiveMediaType = 'video'
      else if (['mp3', 'ogg', 'wav'].includes(ext)) effectiveMediaType = 'audio'
      else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'zip'].includes(ext)) effectiveMediaType = 'document'
    }

    if (mediaUrl && effectiveMediaType !== 'text') {
      result = await sendMedia(session.token, contact.fullPhone, effectiveMediaType as any, mediaUrl, text || '')
    } else if (mediaUrl && effectiveMediaType === 'text') {
      result = await sendMessage(session.token, contact.fullPhone, text ? `${text}\n\n🔗 ${mediaUrl}` : mediaUrl)
    } else {
      result = await sendMessage(session.token, contact.fullPhone, text || '')
    }

    let conversation = await prisma.whatsAppConversation.findUnique({ where: { teamId_contactId: { teamId: tenantId, contactId: contact.id } } })
    if (!conversation) conversation = await prisma.whatsAppConversation.create({ data: { teamId: tenantId, contactId: contact.id } })

    const chatMsg = await prisma.chatMessage.create({
      data: {
        teamId: tenantId, contactId: contact.id, conversationId: conversation.id,
        direction: 'OUTBOUND',
        content: text || (mediaUrl ? `[${effectiveMediaType}]: ${mediaUrl.split('/').pop()}` : ''),
        wuzapiMsgId: result.messageId || null,
        status: result.success ? 'SENT' : 'FAILED',
        senderId: userId,
        type: effectiveMediaType,
        metadata: mediaUrl ? { mediaUrl } : undefined,
      },
      include: { sender: { select: { name: true } } }
    })

    await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { unreadCount: 0, lastMessageAt: new Date() } })
    publishEvent(tenantId, 'new_message', chatMsg)
    return { success: result.success, data: chatMsg, error: result.error }
  }, {
    body: t.Object({
      contactId: t.String(),
      text: t.Optional(t.String()),
      mediaUrl: t.Optional(t.String()),
      mediaType: t.Optional(t.String()),
    })
  })
