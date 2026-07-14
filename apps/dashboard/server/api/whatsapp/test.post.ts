import { defineEventHandler, readBody } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { sendMessage } from '~/lib/whatsapp-engine'

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  const body = await readBody(event)
  const { sessionId } = body

  if (!sessionId) {
    throw createError({ statusCode: 400, statusMessage: 'Session ID required' })
  }

  const session = await prisma.whatsAppSession.findUnique({
    where: { id: sessionId, teamId }
  })

  if (!session || !session.token) {
    throw createError({ statusCode: 404, statusMessage: 'Session not found' })
  }

  if (!session.phone) {
    throw createError({ statusCode: 400, statusMessage: 'Phone number unknown for this device' })
  }

  const result = await sendMessage(session.token, session.phone, '🤖 Test di connessione WaForge riuscito! Il tuo dispositivo è pronto all\'uso.')

  if (!result.success) {
    throw createError({ statusCode: 500, statusMessage: result.error || 'Failed to send test message' })
  }

  return { success: true }
})
