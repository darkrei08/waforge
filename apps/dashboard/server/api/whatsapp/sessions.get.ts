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

  // Poll engine for live status of each session with graceful fallback
  const activeSessions = await Promise.all(
    sessions.map(async (session) => {
      let liveStatus = { connected: false, loggedIn: false, phone: session.phone }
      try {
        liveStatus = await getEngineStatus(session.token)
      } catch (e) {
        // Fallback to DB state if live status check encounters transient timeout/error
        liveStatus = {
          connected: session.status === 'connected',
          loggedIn: Boolean(session.phone),
          phone: session.phone
        }
      }
      
      const effectivePhone = liveStatus.phone || session.phone
      // Update DB if status changed (preserve 'connecting' status while user scans QR code)
      const isConnected = liveStatus.connected || liveStatus.loggedIn || Boolean(effectivePhone)
      const newStatus = isConnected ? 'connected' : (session.status === 'connecting' ? 'connecting' : (session.status === 'connected' && effectivePhone ? 'connected' : 'disconnected'))
      if (session.status !== newStatus || session.phone !== effectivePhone) {
        await prisma.whatsAppSession.update({
          where: { id: session.id },
          data: { status: newStatus, phone: effectivePhone }
        })
      }

      return {
        id: session.id,
        token: session.token,
        name: session.name,
        description: session.description,
        tags: session.tags,
        teamName: session.team?.name,
        status: newStatus,
        phone: effectivePhone,
        engine: ENGINE,
        connected: newStatus === 'connected' || liveStatus.connected || liveStatus.loggedIn,
        loggedIn: liveStatus.loggedIn || Boolean(effectivePhone),
        updatedAt: session.updatedAt
      }
    })
  )

  // Include active sessions and connecting sessions so users can monitor and connect devices without blocking
  const validSessions = activeSessions.filter(s => Boolean(s.phone || s.connected || s.status === 'connected' || s.status === 'connecting' || s.name || s.token))

  return {
    success: true,
    data: validSessions,
    activeEngine: ENGINE,
    supportedEngines: ['wuzapi', 'gowa']
  }
})
