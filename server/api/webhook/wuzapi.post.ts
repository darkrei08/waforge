import { prisma } from '../../utils/prisma'
import { broadcastToTeam } from '../../routes/ws'
import { handleOptOutKeywords } from '../../../lib/whatsapp-policy'

/**
 * Webhook per ricevere eventi in tempo reale da WuzAPI (Messaggi in arrivo)
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const query = getQuery(event)

  // Idealmente configureremo WuzAPI per chiamare /api/webhook/wuzapi?teamId=XXX
  const teamId = query.teamId as string
  if (!teamId) {
    return { error: 'Missing teamId in webhook' }
  }

  // WuzAPI structure is roughly: body.event === 'Message'
  if (body.event === 'Message' && body.data) {
    const msgData = body.data

    // Ignora messaggi di sistema o messaggi inviati da noi
    if (msgData.Info?.MessageSource?.IsFromMe) {
      return { success: true, ignored: 'IsFromMe' }
    }

    const senderJid = msgData.Info?.MessageSource?.Sender // ex: 393331234567@s.whatsapp.net
    if (!senderJid) return { error: 'No sender JID' }
    const phone = senderJid.split('@')[0]

    // Cerca o crea il contatto nella rubrica del team
    let contact = await prisma.contact.findFirst({
      where: { teamId, fullPhone: phone }
    })

    if (!contact) {
      contact = await prisma.contact.create({
        data: {
          teamId,
          fullPhone: phone,
          name: msgData.Info?.PushName || phone, // Nome su WA
          isActive: true
        } as any
      })
    }

    // Estrai il testo del messaggio (WuzAPI supporta diversi tipi, per ora prendiamo text)
    const textContent = msgData.Message?.conversation || msgData.Message?.extendedTextMessage?.text || '[Media/Unsupported]'

    // ── Gestione Opt-Out (GDPR) tramite libreria condivisa ──
    const policyChanged = await handleOptOutKeywords(phone, textContent, teamId)
    if (policyChanged) {
      console.log(`[GDPR] Opt-out registrato per ${phone}`)
    }

    // Salva il messaggio in ChatMessage (Inbound)
    const chatMsg = await prisma.chatMessage.create({
      data: {
        teamId,
        contactId: contact.id,
        direction: 'INBOUND',
        content: textContent,
        wuzapiMsgId: msgData.Info?.Id
      },
      include: { contact: true }
    })

    // 🚀 BROADCAST IN REAL TIME AGLI AGENTI DEL TEAM TRAMITE WEBSOCKET!
    broadcastToTeam(teamId, 'new_message', chatMsg)

    return { success: true, messageId: chatMsg.id }
  }

  return { success: true, ignored: 'Not a message event' }
})
