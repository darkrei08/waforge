/**
 * GET /api/stats/dashboard — Dashboard KPI aggregates
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  const teamId = event.context.user.teamId
  const [
    totalContacts,
    activeContacts,
    totalCampaigns,
    activeCampaigns,
    totalMessages,
    sentMessages,
    failedMessages,
    recentCampaigns,
  ] = await Promise.all([
    prisma.contact.count({ where: { teamId } }),
    prisma.contact.count({ where: { teamId, isActive: true } }),
    prisma.campaign.count({ where: { teamId } }),
    prisma.campaign.count({ where: { teamId, status: 'RUNNING' } }),
    prisma.message.count({ where: { contact: { teamId } } }),
    prisma.message.count({ where: { contact: { teamId }, status: 'SENT' } }),
    prisma.message.count({ where: { contact: { teamId }, status: 'FAILED' } }),
    prisma.campaign.findMany({
      where: { teamId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        totalCount: true,
        sentCount: true,
        failedCount: true,
        scheduledAt: true,
        startedAt: true,
        completedAt: true,
        createdAt: true,
        template: { select: { name: true } },
      },
    }),
  ])

  const successRate = totalMessages > 0
    ? Math.round((sentMessages / totalMessages) * 100)
    : 0

  return {
    data: {
      totalContacts,
      activeContacts,
      totalCampaigns,
      activeCampaigns,
      totalMessages,
      sentMessages,
      failedMessages,
      successRate,
      recentCampaigns,
    },
  }
})
