/**
 * GET /api/campaigns/[id]/stream — SSE for real-time campaign progress
 */

import { defineEventHandler } from 'h3'
import { prisma } from '~/server/utils/prisma'
import { campaignQueue } from '~/server/utils/job-queue'

export default defineEventHandler(async (event) => {
  const id = event.context.params?.id
  const teamId = event.context.user?.teamId

  if (!id || !teamId) throw createError({ statusCode: 400 })

  const campaign = await prisma.campaign.findFirst({
    where: { id, teamId }
  })

  if (!campaign) throw createError({ statusCode: 404 })

  setHeader(event, 'Content-Type', 'text/event-stream')
  setHeader(event, 'Cache-Control', 'no-cache')
  setHeader(event, 'Connection', 'keep-alive')
  setHeader(event, 'X-Accel-Buffering', 'no') // Disable nginx buffering

  let isClosed = false
  event.node.req.on('close', () => {
    isClosed = true
  })

  const sendProgress = async () => {
    if (isClosed) return

    const [c, activeJobs, waitingJobs] = await Promise.all([
      prisma.campaign.findUnique({
        where: { id },
        select: { status: true, totalCount: true, sentCount: true, failedCount: true }
      }),
      campaignQueue.getActive(),
      campaignQueue.getWaiting()
    ])

    if (!c) return

    const isActive = activeJobs.some(j => j.data.campaignId === id) || waitingJobs.some(j => j.data.campaignId === id)
    const progress = c.totalCount > 0 ? Math.round(((c.sentCount + c.failedCount) / c.totalCount) * 100) : 0

    const data = JSON.stringify({
      id,
      status: c.status,
      totalCount: c.totalCount,
      sentCount: c.sentCount,
      failedCount: c.failedCount,
      progress,
      isActive
    })

    event.node.res.write(`data: ${data}\n\n`)

    if (!isActive && c.status !== 'RUNNING') {
      event.node.res.write('event: close\ndata: {}\n\n')
      event.node.res.end()
      isClosed = true
    }
  }

  // Send initial state immediately
  await sendProgress()

  // Start checking every 2 seconds
  const interval = setInterval(async () => {
    if (isClosed) {
      clearInterval(interval)
      return
    }
    await sendProgress()
  }, 2000)

  // Wait until connection closes
  await new Promise<void>((resolve) => {
    event.node.req.on('close', () => {
      clearInterval(interval)
      resolve()
    })
  })
})
