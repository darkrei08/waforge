import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  if (!event.context.user) throw createError({ statusCode: 401, message: 'Non autorizzato' })
  const teamId = event.context.user.teamId
  
  const keys = await prisma.teamApiKey.findMany({
    where: { teamId },
    orderBy: { createdAt: 'desc' }
  })
  
  return keys.map(k => ({
    id: k.id,
    name: k.name,
    key: k.key,
    lastUsedAt: k.lastUsedAt,
    createdAt: k.createdAt
  }))
})
