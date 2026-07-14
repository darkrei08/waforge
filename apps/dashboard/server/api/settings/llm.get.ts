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
    cockpitAccount: '',
    cockpitAccountId: '',
    customBaseUrl: 'http://127.0.0.1:1234/v1',
    mcpServers: [] as string[],
    customCatalog: [] as { name: string; icon: string; cmd: string }[],
  }

  // Merge stored settings over defaults so no field is ever missing
  const stored = (team?.llmSettings as Record<string, unknown>) || {}
  const merged = { ...defaultSettings, ...stored }

  return {
    data: merged
  }
})
