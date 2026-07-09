import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { llmSettings: true }
  })

  const defaultSettings = {
    provider: 'openai',
    apiKey: '',
    model: 'gpt-4o-mini',
    useCockpit: false,
    cockpitAccount: ''
  }

  return {
    data: team?.llmSettings || defaultSettings
  }
})
