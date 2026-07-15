import { defineEventHandler, readBody, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10'
})

// Mappa dei prezzi Stripe - Da sostituire con i veri Price ID della dashboard di Stripe
const TIER_PRICES: Record<string, string> = {
  'PRO': process.env.STRIPE_PRICE_PRO || 'price_1PlaceholderPro',
  'ENTERPRISE': process.env.STRIPE_PRICE_ENTERPRISE || 'price_1PlaceholderEnterprise'
}

export default defineEventHandler(async (event) => {
  if (!event.context.user) throw createError({ statusCode: 401, message: 'Non autorizzato' })
  const teamId = event.context.user.teamId
  const userId = event.context.user.id
  
  const body = await readBody(event)
  const { tier } = body

  if (!tier || !TIER_PRICES[tier]) {
    throw createError({ statusCode: 400, message: 'Tier non valido' })
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId }
  })
  if (!team) throw createError({ statusCode: 404, message: 'Team non trovato' })

  // Recupera o crea Stripe Customer
  let customerId = team.stripeCustomerId
  if (!customerId) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    const customer = await stripe.customers.create({
      email: user?.email,
      name: team.name,
      metadata: { teamId: team.id }
    })
    customerId = customer.id
    await prisma.team.update({
      where: { id: team.id },
      data: { stripeCustomerId: customerId }
    })
  }

  const baseUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: TIER_PRICES[tier],
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${baseUrl}/settings/billing?success=true`,
    cancel_url: `${baseUrl}/settings/billing?canceled=true`,
    metadata: {
      teamId: team.id,
      tier: tier
    }
  })

  return { url: session.url }
})
