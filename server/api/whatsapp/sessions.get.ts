import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { getEngineStatus, ENGINE } from '~/lib/whatsapp-engine'

export default defineEventHandler(async (event) => {
  const authUser = event.context.user
  if (!authUser) throw createError({ statusCode: 401, message: 'Unauthorized' })

  // Find all sessions for the team
  const sessions = await prisma.whatsAppSession.findMany({
    where: { teamId: authUser.teamId },
    include: { team: { select: { name: true } } }
  })

  // Poll engine for live status of each session
  const activeSessions = await Promise.all(
    sessions.map(async (session) => {
      const liveStatus = await getEngineStatus(session.token)
      
      // Update DB if status changed
      const newStatus = liveStatus.connected ? 'connected' : 'disconnected'
      if (session.status !== newStatus || session.phone !== liveStatus.phone) {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { status: newStatus, phone: liveStatus.phone }
        })
      }

      return {
        id: session.id,
        name: session.name,
        description: session.description,
        tags: session.tags,
        teamName: session.team?.name,
        status: newStatus,
        phone: liveStatus.phone,
        engine: ENGINE,
        connected: liveStatus.connected,
        loggedIn: liveStatus.loggedIn,
        updatedAt: session.updatedAt
      }
    })
  )

  return {
    success: true,
    data: activeSessions,
    activeEngine: ENGINE,
    supportedEngines: ['wuzapi', 'gowa']
  }
})
