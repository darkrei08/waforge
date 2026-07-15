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
      currentPeriodEnd: true
    }
  })

  if (!team) throw new Error('Team not found')

  const contactsCount = await prisma.contact.count({ where: { teamId } })
  const devicesCount = await prisma.whatsAppSession.count({ where: { teamId } })

  return {
    team,
    usage: {
      contacts: contactsCount,
      devices: devicesCount
    }
  }
})
