import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { z } from 'zod'

const llmSettingsSchema = z.object({
  provider: z.string().default('openai'),
  apiKey: z.string().default(''),
  model: z.string().default('gpt-4o-mini'),
  useCockpit: z.boolean().default(false),
  cockpitAccount: z.string().default(''),
  cockpitAccountId: z.string().default(''),
  customBaseUrl: z.string().default('http://127.0.0.1:1234/v1'),
  mcpServers: z.array(z.string()).default([]),
  customCatalog: z.array(z.object({
    name: z.string(),
    icon: z.string(),
    cmd: z.string(),
  })).default([]),
}).passthrough()

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  const body = await readBody(event)

  const parsed = llmSettingsSchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Formato dati LLM non valido', data: parsed.error.flatten() })
  }

  const updatedTeam = await prisma.team.update({
    where: { id: teamId },
    data: {
      llmSettings: parsed.data as any
    },
    select: { llmSettings: true }
  })

  return {
    data: updatedTeam.llmSettings
  }
})
