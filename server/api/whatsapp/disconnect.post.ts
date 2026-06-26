import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { disconnectEngine } from '~/lib/whatsapp-engine'
import { securityLog } from '~/lib/security-logger'

export default defineEventHandler(async (event) => {
  const authUser = event.context.user
  if (!authUser) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const body = await readBody(event)
  const token = body?.tokenId

  if (!token) {
    throw createError({ statusCode: 400, message: 'tokenId is required' })
  }

  // Verify token belongs to team
  const session = await prisma.whatsAppSession.findFirst({
    where: { token, teamId: authUser.teamId }
  })

  if (!session) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  await disconnectEngine(token)
  
  // Remove session from DB or mark disconnected
  await prisma.whatsAppSession.delete({
    where: { id: session.id }
  })

  securityLog.whatsappDisconnected()

  return { success: true, message: 'WhatsApp disconnected' }
})
