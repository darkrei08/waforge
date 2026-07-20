/**
 * Redis & BullMQ Connection — Singleton for wa-forge microservice
 */
import IORedis from 'ioredis'
import { Queue, Worker, type Job } from 'bullmq'

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null // Required by BullMQ
})

export const campaignQueue = new Queue('campaigns', {
  connection: connection as any,
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: 1000
  }
})

export const verifyQueue = new Queue('verifications', {
  connection: connection as any
})

/** Publish event to Redis for the Nuxt dashboard to broadcast via WebSocket */
export function publishEvent(teamId: string, event: string, data: unknown) {
  connection.publish('waforge:events', JSON.stringify({ teamId, event, data }))
}

// ── Anti-Ban: Daily Send Counter ──────────────────────────────────────────────

/** Max messaggi giornalieri per singolo team */
export const DAILY_SEND_CAP = 200

export async function getDailySendCount(teamId: string): Promise<number> {
  const key = `antiban:daily:${teamId}:${new Date().toISOString().slice(0, 10)}`
  const count = await connection.get(key)
  return parseInt(count || '0', 10)
}

export async function incrementDailySendCount(teamId: string): Promise<void> {
  const key = `antiban:daily:${teamId}:${new Date().toISOString().slice(0, 10)}`
  const multi = connection.multi()
  multi.incr(key)
  multi.expire(key, 86400)
  await multi.exec()
}
