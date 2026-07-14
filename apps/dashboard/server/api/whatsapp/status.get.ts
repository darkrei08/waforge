import { defineEventHandler, createError, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { getEngineStatus, ENGINE } from '~/lib/whatsapp-engine'

export default defineEventHandler(async (event) => {
  const authUser = event.context.user
  if (!authUser) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const query = getQuery(event)
  const token = query.tokenId as string

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

  const status = await getEngineStatus(token)

  // Update session status in DB if needed (do not overwrite connecting state while scanning QR)
  const isConnectedNow = status.connected || status.loggedIn || Boolean(status.phone)
  const newStatus = isConnectedNow ? 'connected' : (session.status === 'connecting' ? 'connecting' : 'disconnected')
  const effectivePhone = status.phone || session.phone
  if (session.status !== newStatus || session.phone !== effectivePhone) {
    await prisma.whatsAppSession.update({
      where: { id: session.id },
      data: { status: newStatus, phone: effectivePhone }
    })
  }

  return {
    data: {
      ...status,
      activeEngine: ENGINE,
      supportedEngines: ['wuzapi', 'gowa'],
    },
  }
})
