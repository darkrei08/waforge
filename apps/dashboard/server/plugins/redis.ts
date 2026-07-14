import Redis from 'ioredis'
import { broadcastToTeam } from '../routes/ws'

export default defineNitroPlugin((nitroApp) => {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
  const redis = new Redis(redisUrl)

  redis.subscribe('waforge:events', (err, count) => {
    if (err) {
      console.error('[Redis Plugin] Failed to subscribe: %s', err.message)
    } else {
      console.log(`[Redis Plugin] Subscribed successfully! This client is currently subscribed to ${count} channels.`)
    }
  })

  redis.on('message', (channel, message) => {
    if (channel === 'waforge:events') {
      try {
        const payload = JSON.parse(message)
        if (payload.teamId && payload.event && payload.data) {
          // Broadcast to connected WebSocket clients for this team
          broadcastToTeam(payload.teamId, payload.event, payload.data)
        }
      } catch (err) {
        console.error('[Redis Plugin] Failed to parse message', err)
      }
    }
  })
})
