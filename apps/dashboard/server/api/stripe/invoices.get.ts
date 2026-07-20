import { defineEventHandler, createError } from 'h3'
import { prisma } from '../../utils/prisma'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-04-10'
})

export default defineEventHandler(async (event) => {
  if (!event.context.user) throw createError({ statusCode: 401, message: 'Non autorizzato' })
  const teamId = event.context.user.teamId
  
  const team = await prisma.team.findUnique({
    where: { id: teamId }
  })
  
  if (!team || !team.stripeCustomerId) {
    return { invoices: [] }
  }

  const invoices = await stripe.invoices.list({
    customer: team.stripeCustomerId,
    limit: 20
  })

  return {
    invoices: invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      amount: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      date: new Date(inv.created * 1000).toISOString(),
      pdf: inv.invoice_pdf,
      url: inv.hosted_invoice_url
    }))
  }
})
