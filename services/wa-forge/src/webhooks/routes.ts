/**
 * Webhook Routes — GoWA + WuzAPI + OpenWA incoming message handlers
 * Mounted under /wa/webhook (no auth/feature-guard — webhooks are public)
 */
import { Elysia } from 'elysia'
import { PrismaClient } from '@waforge/database'
import { parseAndCleanPhone } from '../utils/phone'
import { handleOptOutKeywords } from '../utils/wa-policy'
import { publishEvent } from '../utils/redis'

const prisma = new PrismaClient()

export const webhookRoutes = new Elysia({ prefix: '/webhook' })

  // ── GoWA Webhook (GET = verification, POST = messages) ─────────────────────
  .get('/gowa', ({ query, set }) => {
    const mode = query['hub.mode']
    const token = query['hub.verify_token']
    const challenge = query['hub.challenge']
    const verifyToken = process.env.GOWA_VERIFY_TOKEN || 'waforge_verify_token'
    if (mode === 'subscribe' && token === verifyToken) return challenge
    set.status = 403
    return { error: 'Forbidden' }
  })

  .post('/gowa', async ({ body: rawBody }) => {
    const body = rawBody as any

    // --- GOWA (aldinokemal) ---
    if (body.event && body.device_id) {
      const phoneNumberId = body.device_id.split('@')[0]
      const session = await prisma.whatsAppSession.findFirst({ where: { phone: phoneNumberId } })
      if (!session) return { status: 'ignored' }
      const teamId = session.teamId

      // Read receipts
      if (body.event === 'message.ack' && body.payload) {
        const ids = body.payload.ids || []
        const receiptType = body.payload.receipt_type || 'delivered'
        for (const wamid of ids) {
          const updatedMsg = await prisma.chatMessage.updateMany({ where: { wamid }, data: { status: receiptType.toUpperCase() } })
          if (updatedMsg.count > 0) {
            const msg = await prisma.chatMessage.findFirst({ where: { wamid } })
            if (msg) publishEvent(teamId, 'message_ack', msg)
          }
        }
      }

      // Incoming message
      if (body.event === 'message' && body.payload) {
        const from = (body.payload.from || body.payload.chat_id || '').split('@')[0]
        const wamid = body.payload.id
        const content = body.payload.body || '[Unsupported/Media]'
        const pushName = body.payload.push_name || from
        const isFromMe = body.payload.from_me || false

        if (!isFromMe) {
          let contact = await prisma.contact.findFirst({ where: { teamId, fullPhone: from } })
          if (!contact) {
            const parsed = parseAndCleanPhone(from)
            contact = await prisma.contact.create({ data: { teamId, fullPhone: parsed.fullPhone || from, prefix: parsed.prefix, phone: parsed.phone || from, name: pushName, isActive: true, source: 'webhook' } })
          }

          await handleOptOutKeywords(from, content, teamId)

          let conversation = await prisma.whatsAppConversation.findUnique({ where: { teamId_contactId: { teamId, contactId: contact.id } } })
          if (!conversation) conversation = await prisma.whatsAppConversation.create({ data: { teamId, contactId: contact.id } })

          const chatMsg = await prisma.chatMessage.create({
            data: { teamId, contactId: contact.id, conversationId: conversation.id, direction: 'INBOUND', type: 'text', content, wamid, status: 'DELIVERED' },
            include: { contact: true }
          })

          await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { unreadCount: { increment: 1 }, lastMessageAt: new Date() } })
          publishEvent(teamId, 'new_message', chatMsg)
        }
      }
      return { status: 'success' }
    }

    // --- Meta Cloud API fallback ---
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value
          if (!value) continue
          const phoneNumberId = value.metadata?.phone_number_id
          const session = await prisma.whatsAppSession.findFirst({ where: { phone: phoneNumberId } })
          if (!session) continue
          const teamId = session.teamId

          if (value.statuses) {
            for (const status of value.statuses) {
              const updatedMsg = await prisma.chatMessage.updateMany({ where: { wamid: status.id }, data: { status: status.status.toUpperCase() } })
              if (updatedMsg.count > 0) {
                const msg = await prisma.chatMessage.findFirst({ where: { wamid: status.id } })
                if (msg) publishEvent(teamId, 'message_ack', msg)
              }
            }
          }

          if (value.messages) {
            for (const msg of value.messages) {
              const from = msg.from
              const pushName = value.contacts?.[0]?.profile?.name || from
              let contact = await prisma.contact.findFirst({ where: { teamId, fullPhone: from } })
              if (!contact) {
                const parsed = parseAndCleanPhone(from)
                contact = await prisma.contact.create({ data: { teamId, fullPhone: parsed.fullPhone || from, prefix: parsed.prefix, phone: parsed.phone || from, name: pushName, isActive: true, source: 'webhook' } })
              }

              let content = '[Unsupported]'
              let metadata: any = null
              if (msg.type === 'text') { content = msg.text.body; await handleOptOutKeywords(from, content, teamId) }
              else if (msg.type === 'image') { content = '[Image]'; metadata = { mediaId: msg.image.id, mimeType: msg.image.mime_type } }
              else if (msg.type === 'reaction') { content = `[Reaction: ${msg.reaction.emoji}]`; metadata = { emoji: msg.reaction.emoji, targetMessageId: msg.reaction.message_id } }

              let conversation = await prisma.whatsAppConversation.findUnique({ where: { teamId_contactId: { teamId, contactId: contact.id } } })
              if (!conversation) conversation = await prisma.whatsAppConversation.create({ data: { teamId, contactId: contact.id } })

              const chatMsg = await prisma.chatMessage.create({
                data: { teamId, contactId: contact.id, conversationId: conversation.id, direction: 'INBOUND', type: msg.type, content, wamid: msg.id, status: 'DELIVERED', metadata },
                include: { contact: true }
              })
              await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { unreadCount: { increment: 1 }, lastMessageAt: new Date() } })
              publishEvent(teamId, 'new_message', chatMsg)
            }
          }
        }
      }
      return { status: 'success' }
    }

    return { status: 'ignored' }
  })

  // ── WuzAPI Webhook ─────────────────────────────────────────────────────────
  .post('/wuzapi', async ({ body: rawBody, query }) => {
    const body = rawBody as any
    const teamId = query.teamId as string
    if (!teamId) return { error: 'Missing teamId in webhook' }

    if (body.event === 'Message' && body.data) {
      const msgData = body.data
      if (msgData.Info?.MessageSource?.IsFromMe) return { success: true, ignored: 'IsFromMe' }

      const senderJid = msgData.Info?.MessageSource?.Sender
      if (!senderJid) return { error: 'No sender JID' }
      const phone = senderJid.split('@')[0]

      let contact = await prisma.contact.findFirst({ where: { teamId, fullPhone: phone } })
      if (!contact) {
        const parsed = parseAndCleanPhone(phone)
        contact = await prisma.contact.create({ data: { teamId, fullPhone: parsed.fullPhone || phone, prefix: parsed.prefix, phone: parsed.phone || phone, name: msgData.Info?.PushName || phone, isActive: true, source: 'webhook' } as any })
      }

      const textContent = msgData.Message?.conversation || msgData.Message?.extendedTextMessage?.text || '[Media/Unsupported]'
      await handleOptOutKeywords(phone, textContent, teamId)

      let conversation = await prisma.whatsAppConversation.findUnique({ where: { teamId_contactId: { teamId, contactId: contact.id } } })
      if (!conversation) conversation = await prisma.whatsAppConversation.create({ data: { teamId, contactId: contact.id } })

      const chatMsg = await prisma.chatMessage.create({
        data: { teamId, contactId: contact.id, conversationId: conversation.id, direction: 'INBOUND', content: textContent, wuzapiMsgId: msgData.Info?.Id },
        include: { contact: true }
      })

      await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { unreadCount: { increment: 1 }, lastMessageAt: new Date() } })
      publishEvent(teamId, 'new_message', chatMsg)
      return { success: true, messageId: chatMsg.id }
    }

    return { success: true, ignored: 'Not a message event' }
  })
