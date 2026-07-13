import { prisma } from '../../utils/prisma'
import { broadcastToTeam } from '../../routes/ws'
import { handleOptOutKeywords } from '../../../lib/whatsapp-policy'
import { parseAndCleanPhone } from '../../../lib/phone'


export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  const query = getQuery(event)

  if (method === 'GET') {
    const mode = query['hub.mode']
    const token = query['hub.verify_token']
    const challenge = query['hub.challenge']
    const verifyToken = process.env.GOWA_VERIFY_TOKEN || 'waforge_verify_token'
    if (mode === 'subscribe' && token === verifyToken) {
      return challenge
    } else {
      throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
    }
  }

  if (method === 'POST') {
    const body = await readBody(event)

    // --- 1. GOWA (aldinokemal/go-whatsapp-web-multidevice) ---
    if (body.event && body.device_id) {
      // Find session by device_id (phone)
      const phoneNumberId = body.device_id.split('@')[0]
      const session = await prisma.whatsAppSession.findFirst({
        where: { phone: phoneNumberId }
      })
      if (!session) return { status: 'ignored' }
      const teamId = session.teamId

      // Handle message.ack (Read Receipts, etc)
      if (body.event === 'message.ack' && body.payload) {
        const ids = body.payload.ids || []
        const receiptType = body.payload.receipt_type || 'delivered'
        for (const wamid of ids) {
          const updatedMsg = await prisma.chatMessage.updateMany({
            where: { wamid },
            data: { status: receiptType.toUpperCase() }
          })
          if (updatedMsg.count > 0) {
            const msg = await prisma.chatMessage.findFirst({ where: { wamid } })
            if (msg) broadcastToTeam(teamId, 'message_ack', msg)
          }
        }
      }

      // Handle message
      if (body.event === 'message' && body.payload) {
        const from = (body.payload.from || body.payload.chat_id || '').split('@')[0]
        const wamid = body.payload.id
        const content = body.payload.body || '[Unsupported/Media]'
        const pushName = body.payload.push_name || from
        const isFromMe = body.payload.from_me || false

        if (!isFromMe) {
          let contact = await prisma.contact.findFirst({
            where: { teamId, fullPhone: from }
          })
          if (!contact) {
            const parsed = parseAndCleanPhone(from)
            contact = await prisma.contact.create({
              data: { teamId, fullPhone: parsed.fullPhone || from, prefix: parsed.prefix, phone: parsed.phone || from, name: pushName, isActive: true, source: 'webhook' }
            })
          }

          // Opt-out check
          await handleOptOutKeywords(from, content, teamId)

          let conversation = await prisma.whatsAppConversation.findUnique({
            where: { teamId_contactId: { teamId, contactId: contact.id } }
          })
          if (!conversation) {
            conversation = await prisma.whatsAppConversation.create({
              data: { teamId, contactId: contact.id }
            })
          }

          const chatMsg = await prisma.chatMessage.create({
            data: {
              teamId,
              contactId: contact.id,
              conversationId: conversation.id,
              direction: 'INBOUND',
              type: 'text',
              content,
              wamid,
              status: 'DELIVERED'
            },
            include: { contact: true }
          })

          await prisma.whatsAppConversation.update({
            where: { id: conversation.id },
            data: { unreadCount: { increment: 1 }, lastMessageAt: new Date() }
          })

          broadcastToTeam(teamId, 'new_message', chatMsg)
        }
      }
      return { status: 'success' }
    }

    // --- 2. Meta Cloud API ---
    if (body.object === 'whatsapp_business_account') {
      // (Mantengo il codice originale Meta fallback se serve in futuro)
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value
          if (!value) continue

          const phoneNumberId = value.metadata?.phone_number_id
          const session = await prisma.whatsAppSession.findFirst({
            where: { phone: phoneNumberId }
          })
          if (!session) continue
          const teamId = session.teamId

          if (value.statuses) {
            for (const status of value.statuses) {
              const wamid = status.id
              const statusType = status.status
              const updatedMsg = await prisma.chatMessage.updateMany({
                where: { wamid },
                data: { status: statusType.toUpperCase() }
              })
              if (updatedMsg.count > 0) {
                const msg = await prisma.chatMessage.findFirst({ where: { wamid } })
                if (msg) broadcastToTeam(teamId, 'message_ack', msg)
              }
            }
          }

          if (value.messages) {
            for (const msg of value.messages) {
              const from = msg.from
              const wamid = msg.id
              const type = msg.type
              const pushName = value.contacts?.[0]?.profile?.name || from
              
              let contact = await prisma.contact.findFirst({
                where: { teamId, fullPhone: from }
              })

              if (!contact) {
                const parsed = parseAndCleanPhone(from)
                contact = await prisma.contact.create({
                  data: { teamId, fullPhone: parsed.fullPhone || from, prefix: parsed.prefix, phone: parsed.phone || from, name: pushName, isActive: true, source: 'webhook' }
                })
              }

              let content = '[Unsupported]'
              let metadata: any = null

              if (type === 'text') {
                content = msg.text.body
                await handleOptOutKeywords(from, content, teamId)
              } else if (type === 'image') {
                content = '[Image]'
                metadata = { mediaId: msg.image.id, mimeType: msg.image.mime_type }
              } else if (type === 'reaction') {
                content = `[Reaction: ${msg.reaction.emoji}]`
                metadata = { emoji: msg.reaction.emoji, targetMessageId: msg.reaction.message_id }
              }
              
              let conversation = await prisma.whatsAppConversation.findUnique({
                where: { teamId_contactId: { teamId, contactId: contact.id } }
              })
              if (!conversation) {
                conversation = await prisma.whatsAppConversation.create({
                  data: { teamId, contactId: contact.id }
                })
              }

              const chatMsg = await prisma.chatMessage.create({
                data: { teamId, contactId: contact.id, conversationId: conversation.id, direction: 'INBOUND', type, content, wamid, status: 'DELIVERED', metadata },
                include: { contact: true }
              })
              
              await prisma.whatsAppConversation.update({
                where: { id: conversation.id },
                data: { unreadCount: { increment: 1 }, lastMessageAt: new Date() }
              })

              broadcastToTeam(teamId, 'new_message', chatMsg)
            }
          }
        }
      }
      return { status: 'success' }
    }

    return { status: 'ignored' }
  }
})
