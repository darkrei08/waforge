import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '../../../utils/prisma'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  if (!event.context.user) throw createError({ statusCode: 401, message: 'Non autorizzato' })
  const teamId = event.context.user.teamId
  const body = await readBody(event)
  
  if (!body.name) throw createError({ statusCode: 400, message: 'Nome obbligatorio' })
  
  // Genera un token sicuro
  const token = 'wa_' + crypto.randomBytes(24).toString('hex')
  
  const key = await prisma.teamApiKey.create({
    data: {
      teamId,
      name: body.name,
      key: token
    }
  })
  
  return {
    id: key.id,
    name: key.name,
    key: key.key,
    createdAt: key.createdAt
  }
})
