/**
 * Feature Guard Middleware — Verifies the tenant has "waforge.campaigns" enabled
 */
import { Elysia } from 'elysia'
import { PrismaClient } from '@waforge/database'

const prisma = new PrismaClient()

export const featureGuard = new Elysia({ name: 'feature-guard' })
  .derive(async ({ tenantId, set }) => {
    if (!tenantId) {
      set.status = 403
      throw new Error('No tenant context. Login required.')
    }

    const team = await prisma.team.findUnique({
      where: { id: tenantId },
      select: { activeFeatures: true }
    })

    if (!team) {
      set.status = 404
      throw new Error('Tenant not found')
    }

    const features = team.activeFeatures as string[] | null
    if (!features || !Array.isArray(features) || !features.includes('waforge.campaigns')) {
      set.status = 403
      throw new Error('Feature "waforge.campaigns" not enabled for this tenant. Upgrade your plan.')
    }

    return { teamFeatures: features }
  })
