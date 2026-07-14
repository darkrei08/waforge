import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { disconnectEngine } from '~/lib/whatsapp-engine'
import { securityLog } from '~/lib/security-logger'

export default defineEventHandler(async (event) => {
  const authUser = event.context.user
  if (!authUser) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  const sessionId = body?.sessionId || body?.tokenId // fallback for old frontends

  if (!sessionId) {
    throw createError({ statusCode: 400, message: 'sessionId is required' })
  }

  // Verify session belongs to team
  const session = await prisma.whatsAppSession.findFirst({
    where: { id: sessionId, teamId: authUser.teamId }
  })

  if (!session) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  try {
    await disconnectEngine(session.token)
  } catch (err) {
    // Ignore engine errors (e.g. 404 device not found) so we can still clean up our DB
    console.warn(`[Disconnect] Engine error for token ${session.token}:`, err)
  }
  
  // Remove session from DB or mark disconnected
  await prisma.whatsAppSession.delete({
    where: { id: session.id }
  })

  securityLog.whatsappDisconnected()

  return { success: true, message: 'WhatsApp disconnected' }
})
