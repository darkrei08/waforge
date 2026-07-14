import { defineEventHandler, createError, getQuery } from 'h3'
import { prisma } from '../../utils/prisma'
import { getQRCode } from '~/lib/whatsapp-engine'
import { randomBytes } from 'crypto'

export default defineEventHandler(async (event) => {
  const authUser = event.context.user
  if (!authUser) throw createError({ statusCode: 401, message: 'Unauthorized' })

  const query = getQuery(event)
  let token = query.tokenId as string

  // Se non viene passato un token, creiamo una nuova sessione
  if (!token) {
    token = randomBytes(16).toString('hex')
    await prisma.whatsAppSession.create({
      data: {
        teamId: authUser.teamId,
        token: token,
        status: 'connecting'
      }
    })
  } else {
    // Verifica che il token appartenga al team
    const session = await prisma.whatsAppSession.findFirst({
      where: { token, teamId: authUser.teamId }
    })
    if (!session) {
      throw createError({ statusCode: 403, message: 'Forbidden' })
    }
  }

  const qrCode = await getQRCode(token)

  return {
    data: {
      qrCode,
      tokenId: token,
      available: !!qrCode,
    },
  }
})
