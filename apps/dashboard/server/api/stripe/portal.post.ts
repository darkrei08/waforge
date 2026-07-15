import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import { requireAuth } from '../../utils/auth'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10'
})

export default defineEventHandler(async (event) => {
  const auth = await requireAuth(event)
  
  const team = await prisma.team.findUnique({
    where: { id: auth.teamId }
  })
  if (!team || !team.stripeCustomerId) {
    throw createError({ statusCode: 400, message: 'Nessun account di fatturazione trovato per questo team.' })
  }

  const baseUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: team.stripeCustomerId,
    return_url: `${baseUrl}/settings/billing`,
  })

  return { url: portalSession.url }
})
