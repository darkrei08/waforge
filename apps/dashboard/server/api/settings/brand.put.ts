import { defineEventHandler, readBody } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  const body = await readBody(event)

  const updatedTeam = await prisma.team.update({
    where: { id: teamId },
    data: {
      brandSettings: body
    },
    select: { brandSettings: true }
  })

  return {
    data: updatedTeam.brandSettings
  }
})
