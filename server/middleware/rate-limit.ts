/**
 * Rate Limiting Middleware — OWASP A04 (Insecure Design)
 *
 * In-memory sliding window rate limiter.
 * Limits requests per IP to prevent abuse and DoS.
 */

import { defineEventHandler, getRequestIP, createError } from 'h3'
import { securityLog } from '~/lib/security-logger'

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Config
const WINDOW_MS = 60 * 1000  // 1 minute window
const MAX_REQUESTS = 120     // max requests per window per IP

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}, 5 * 60 * 1000)

export default defineEventHandler((event) => {
  // Only rate-limit API routes
  const path = event.path || ''
  if (!path.startsWith('/api/')) return

  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  const now = Date.now()

  // Configurare limiti diversi per il login/register (prevenzione brute-force)
  const isAuthAction = path === '/api/auth/login' || path === '/api/auth/register' || path === '/api/auth/invite' || path === '/api/auth/oauth/pocketid'
  const limit = isAuthAction ? 10 : MAX_REQUESTS

  let entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS }
    store.set(ip, entry)
  } else {
    entry.count++
  }

  // Set rate limit headers
  event.node.res.setHeader('X-RateLimit-Limit', limit.toString())
  event.node.res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - entry.count).toString())
  event.node.res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetAt / 1000).toString())

  if (entry.count > limit) {
    securityLog.rateLimited(ip)
    throw createError({
      statusCode: 429,
      statusMessage: 'Too Many Requests',
      data: { error: 'Rate limit exceeded. Try again later.' },
    })
  }
})
