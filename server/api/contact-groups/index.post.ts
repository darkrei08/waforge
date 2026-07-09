import { prisma } from '~/server/utils/prisma'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(1, 'Il nome è obbligatorio'),
  color: z.string().optional()
})

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  
  const body = await readBody(event)
  
  try {
    const data = createSchema.parse(body)
    
    // Check if a group with this name already exists in the team
    const existing = await prisma.contactGroup.findUnique({
      where: {
        teamId_name: {
          teamId,
          name: data.name
        }
      }
    })
    
    if (existing) {
      return createError({ statusCode: 409, message: 'Esiste già una rubrica con questo nome.' })
    }

    const group = await prisma.contactGroup.create({
      data: {
        name: data.name,
        color: data.color,
        teamId
      }
    })

    return { success: true, data: group }
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return createError({ statusCode: 400, message: error.errors[0].message })
    }
    return createError({ statusCode: 500, message: error.message })
  }
})
