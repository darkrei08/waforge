import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  if (!event.context.user) throw createError({ statusCode: 401, message: 'Non autorizzato' })
  const teamId = event.context.user.teamId
  const id = event.context.params?.id
  
  if (!id) throw createError({ statusCode: 400, message: 'ID obbligatorio' })
  
  // Ensure the key belongs to the team
  const key = await prisma.teamApiKey.findFirst({
    where: { id, teamId }
  })
  
  if (!key) throw createError({ statusCode: 404, message: 'Chiave non trovata' })
  
  await prisma.teamApiKey.delete({
    where: { id }
  })
  
  return { success: true }
})
