/**
 * RBAC Middleware — Role-Based Access Control
 * Runs after auth.ts middleware. Blocks non-admin users from accessing
 * billing, team management, and API key management endpoints.
 */
import { defineEventHandler, createError } from 'h3'

const ADMIN_ONLY_ROUTES = [
  '/api/stripe/checkout',
  '/api/stripe/portal',
  '/api/team/keys',
  '/api/team/index.patch',
]

const ADMIN_ONLY_PREFIXES = [
  '/api/team/members/',  // DELETE member
]

export default defineEventHandler(async (event) => {
  // Only apply to API routes
  if (!event.path.startsWith('/api/')) return
  
  // Skip if no user context (auth middleware handles 401)
  if (!event.context.user) return
  
  const role = event.context.user.role
  const isSuperAdmin = event.context.user.isSuperAdmin
  
  // SuperAdmins bypass all checks
  if (isSuperAdmin) return
  
  // Check if the route requires admin/owner role
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(r => event.path.startsWith(r)) ||
                       ADMIN_ONLY_PREFIXES.some(p => event.path.startsWith(p))
  
  if (isAdminRoute && role !== 'OWNER' && role !== 'ADMIN') {
    throw createError({
      statusCode: 403,
      message: 'Accesso riservato agli amministratori del Team.'
    })
  }
})
