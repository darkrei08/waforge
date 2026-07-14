import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'

/**
 * GET /api/chat — Fetch active conversations for the team
 */
export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId

  // To get conversations, we get the distinct contacts that have chat messages,
  // ordered by the latest message. We can group or just fetch latest message per contact.
  
  // Find contacts that have chat history
  const contactsWithChats = await prisma.contact.findMany({
    where: {
      teamId,
      chatHistory: { some: {} }
    },
    include: {
      chatHistory: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  })

  // Sort by the latest message across contacts
  const sorted = contactsWithChats.sort((a, b) => {
    const timeA = a.chatHistory[0]?.createdAt.getTime() || 0
    const timeB = b.chatHistory[0]?.createdAt.getTime() || 0
    return timeB - timeA
  })

  return {
    data: sorted.map(c => ({
      ...c,
      latestMessage: c.chatHistory[0] || null,
      chatHistory: undefined // don't expose array
    }))
  }
})
