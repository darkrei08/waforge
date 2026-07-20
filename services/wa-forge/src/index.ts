/**
 * WA Forge Microservice — Entry Point
 * Port 3010
 */
import { Elysia } from 'elysia'
import { jwtAuth } from './middleware/jwt-auth'
import { featureGuard } from './middleware/feature-guard'
import { campaignRoutes } from './campaigns/routes'
import { webhookRoutes } from './webhooks/routes'
import { sessionRoutes } from './sessions/routes'
import { chatRoutes } from './chat/routes'

// Import workers to keep them running in background
import './campaigns/worker'

const app = new Elysia({ prefix: '/wa' })
  // Public routes (Webhooks)
  .use(webhookRoutes)

  // Protected routes
  .use(jwtAuth)
  .use(featureGuard)
  .use(campaignRoutes)
  .use(sessionRoutes)
  .use(chatRoutes)
  
  .get('/health', () => ({ status: 'ok', service: 'wa-forge' }))

  .listen(3010)

console.log(`🚀 WA Forge microservice is running at ${app.server?.hostname}:${app.server?.port}`)
