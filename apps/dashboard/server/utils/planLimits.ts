import { prisma } from './prisma'
import { createError } from 'h3'

export const PLAN_LIMITS: Record<string, { devices: number, contacts: number, groups: number, campaigns: number, templates: number }> = {
  FREE: { devices: 1, contacts: 10, groups: 1, campaigns: 1, templates: 1 },
  PRO: { devices: 3, contacts: -1, groups: -1, campaigns: -1, templates: -1 },
  ENTERPRISE: { devices: -1, contacts: -1, groups: -1, campaigns: -1, templates: -1 }
}

export async function checkPlanLimit(teamId: string, resource: 'devices' | 'contacts' | 'groups' | 'campaigns' | 'templates') {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { planTier: true }
  })
  
  if (!team) throw createError({ statusCode: 404, message: 'Team non trovato' })
  
  const tier = team.planTier || 'FREE'
  const limit = PLAN_LIMITS[tier]?.[resource] ?? 0
  
  // -1 significa illimitato
  if (limit === -1) return true

  // Controlliamo il count attuale della risorsa
  let currentCount = 0
  switch (resource) {
    case 'devices':
      currentCount = await prisma.whatsAppSession.count({ where: { teamId } })
      break
    case 'contacts':
      currentCount = await prisma.contact.count({ where: { teamId } })
      break
    case 'groups':
      currentCount = await prisma.contactGroup.count({ where: { teamId } })
      break
    case 'campaigns':
      // Conta quante campagne sono state create in totale (limitiamo la creazione globale su free tier per evitare abusi)
      currentCount = await prisma.campaign.count({ where: { teamId } })
      break
    case 'templates':
      currentCount = await prisma.template.count({ where: { teamId } })
      break
  }

  if (currentCount >= limit) {
    throw createError({ 
      statusCode: 403, 
      message: `Hai raggiunto il limite massimo di ${resource} consentiti dal tuo piano (${tier}). Effettua l'upgrade per sbloccare più risorse.` 
    })
  }

  return true
}
