import { defineEventHandler } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  
  const team = await prisma.team.findUnique({
    where: { id: auth.teamId },
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

  const contactsCount = await prisma.contact.count({ where: { teamId: auth.teamId } })
  const devicesCount = await prisma.whatsAppSession.count({ where: { teamId: auth.teamId } })

  return {
    team,
    usage: {
      contacts: contactsCount,
      devices: devicesCount
    }
  }
})
