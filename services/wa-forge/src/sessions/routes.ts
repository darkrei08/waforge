/**
 * WhatsApp Session Routes — QR, Status, Disconnect
 * Mounted under /wa/sessions (protected by JWT + Feature Guard)
 */
import { Elysia, t } from 'elysia'
import { PrismaClient } from '@waforge/database'
import { getEngineStatus, getQRCode, disconnectEngine } from '../utils/engines'

const prisma = new PrismaClient()

export const sessionRoutes = new Elysia({ prefix: '/sessions' })

  // Get all sessions for this team
  .get('/', async ({ tenantId }) => {
    const sessions = await prisma.whatsAppSession.findMany({ where: { teamId: tenantId } })

    // Enrich with live engine status
    const enriched = await Promise.all(sessions.map(async (s) => {
      try {
        const status = await getEngineStatus(s.token)
        return { ...s, engineStatus: status }
      } catch {
        return { ...s, engineStatus: { connected: false, loggedIn: false, engine: 'unknown' } }
      }
    }))

    return { data: enriched }
  })

  // Get QR code for a session
  .get('/qr', async ({ tenantId }) => {
    const session = await prisma.whatsAppSession.findFirst({ where: { teamId: tenantId } })
    if (!session) return { error: 'No session found. Create a session first.' }
    const qr = await getQRCode(session.token)
    return { data: { qr, sessionId: session.id } }
  })

  // Get live status
  .get('/status', async ({ tenantId }) => {
    const session = await prisma.whatsAppSession.findFirst({ where: { teamId: tenantId } })
    if (!session) return { data: { connected: false, loggedIn: false, engine: 'none' } }
    const status = await getEngineStatus(session.token)

    // Sync phone number to DB if changed
    if (status.phone && status.phone !== session.phone) {
      await prisma.whatsAppSession.update({ where: { id: session.id }, data: { phone: status.phone, status: status.connected ? 'connected' : 'disconnected' } })
    }

    return { data: status }
  })

  // Update session metadata
  .patch('/:id', async ({ params, body, tenantId }) => {
    const session = await prisma.whatsAppSession.findFirst({ where: { id: params.id, teamId: tenantId } })
    if (!session) throw new Error('Session not found')
    const updated = await prisma.whatsAppSession.update({
      where: { id: params.id },
      data: { ...(body.name && { name: body.name }), ...(body.description && { description: body.description }), ...(body.tags && { tags: body.tags }) }
    })
    return { data: updated }
  }, {
    body: t.Object({
      name: t.Optional(t.String()),
      description: t.Optional(t.String()),
      tags: t.Optional(t.String()),
    })
  })

  // Disconnect session
  .post('/disconnect', async ({ tenantId }) => {
    const session = await prisma.whatsAppSession.findFirst({ where: { teamId: tenantId } })
    if (!session) throw new Error('No session found')
    await disconnectEngine(session.token)
    await prisma.whatsAppSession.update({ where: { id: session.id }, data: { status: 'disconnected' } })
    return { success: true }
  })
