import { defineEventHandler, createError } from 'h3'
import { startVerificationJob } from '~/server/utils/job-queue'
import { prisma } from '~/server/utils/prisma'
import { z } from 'zod'
import { zodReadBody } from '~/server/utils/validation'

const VerifySchema = z.object({
  contactIds: z.array(z.string().min(1)).optional(), // Se assente, verifica tutti quelli con isOnWhatsApp: null
})

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  
  // Verifica se esiste una sessione attiva
  const session = await prisma.whatsAppSession.findFirst({ where: { teamId } })
  if (!session || !session.token) {
    throw createError({ statusCode: 400, statusMessage: 'Nessun dispositivo WhatsApp connesso per la verifica.' })
  }

  const { contactIds } = await zodReadBody(event, VerifySchema)

  const count = await startVerificationJob(teamId, contactIds)

  return { data: { enqueued: count } }
})
