import { defineEventHandler, createError } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { z } from 'zod'

const BulkGroupSchema = z.object({
  contactIds: z.array(z.string().min(1)).min(1),
  groupId: z.string().min(1),
  action: z.enum(['add', 'remove'])
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { contactIds, groupId, action } = BulkGroupSchema.parse(body)
  const teamId = event.context.user.teamId

  // Verify group belongs to team
  const group = await prisma.contactGroup.findUnique({
    where: { id: groupId }
  })

  if (!group || group.teamId !== teamId) {
    throw createError({ statusCode: 404, message: 'Group not found' })
  }

  try {
    // Only update contacts that belong to the team
    if (action === 'add') {
      // For each contact, we use update to connect the group.
      // Doing this sequentially in a transaction to ensure safe updates.
      await prisma.$transaction(
        contactIds.map(id => prisma.contact.update({
          where: { id, teamId },
          data: { groups: { connect: { id: groupId } } }
        }))
      )
    } else {
      await prisma.$transaction(
        contactIds.map(id => prisma.contact.update({
          where: { id, teamId },
          data: { groups: { disconnect: { id: groupId } } }
        }))
      )
    }

    return { success: true }
  } catch (error: any) {
    throw createError({ statusCode: 500, message: error.message })
  }
})
