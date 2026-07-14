import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { brandSettings: true }
  })

  // Default 2026 Brand Trend settings if null
  const defaultSettings = {
    primaryColor: '#25D366',
    secondaryColor: '#128C7E',
    fontName: 'Inter',
    enableGlassmorphism: true,
    motionLevel: 50,
  }

  return {
    data: team?.brandSettings || defaultSettings
  }
})
