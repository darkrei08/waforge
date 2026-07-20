import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { createError } from 'h3'

export default defineEventHandler(async (event) => {
  if (!event.context.user) throw createError({ statusCode: 401, message: 'Non autorizzato' })
  const teamId = event.context.user.teamId
  
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      planTier: true,
      stripeCustomerId: true,
      subscriptionStatus: true,
      currentPeriodEnd: true,
      limits: true
    }
  })

  if (!team) throw new Error('Team not found')

  const contactsCount = await prisma.contact.count({ where: { teamId } })
  const devicesCount = await prisma.whatsAppSession.count({ where: { teamId } })

  // Parse limits from team JSON or use defaults
  const parsedLimits = typeof team.limits === 'object' && team.limits !== null ? team.limits as Record<string, number> : {}

  return {
    team,
    usage: {
      contacts: contactsCount,
      devices: devicesCount
    },
    limits: {
      contacts: parsedLimits.maxContacts ?? 500,
      devices: parsedLimits.maxDevices ?? 1
    }
  }
})
