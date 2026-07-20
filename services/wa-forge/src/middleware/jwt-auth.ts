/**
 * JWT Authentication Middleware for wa-forge
 * Verifies the JWT token and extracts userId + activeTenantId
 */
import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-for-dev'

export const jwtAuth = new Elysia({ name: 'jwt-auth' })
  .use(jwt({ name: 'jwt', secret: jwtSecret }))
  .derive(async ({ jwt, headers, set }) => {
    const auth = headers.authorization
    if (!auth) {
      set.status = 401
      throw new Error('Authorization header required')
    }

    const token = auth.replace('Bearer ', '')
    const payload = await jwt.verify(token)
    if (!payload) {
      set.status = 401
      throw new Error('Invalid or expired token')
    }

    return {
      userId: (payload as any).userId as string,
      tenantId: (payload as any).activeTenantId as string,
      isSuperAdmin: (payload as any).isSuperAdmin as boolean,
    }
  })
