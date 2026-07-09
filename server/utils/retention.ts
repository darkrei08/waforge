import { prisma } from './prisma'

export async function runDataRetention() {
  
  const dueAnniFa = new Date()
  dueAnniFa.setFullYear(dueAnniFa.getFullYear() - 2)

  try {
    // Elimina campagne inattive da oltre 2 anni
    const deletedCampaigns = await prisma.campaign.deleteMany({
      where: {
        updatedAt: {
          lt: dueAnniFa
        }
      }
    })
    console.log(`[Retention] Campagne eliminate: ${deletedCampaigns.count}`)

    // Elimina contatti inattivi da oltre 2 anni
    const deletedContacts = await prisma.contact.deleteMany({
      where: {
        updatedAt: {
          lt: dueAnniFa
        }
      }
    })
    console.log(`[Retention] Contatti eliminati: ${deletedContacts.count}`)

    console.log('[Retention] Pulizia completata con successo.')
  } catch (error) {
    console.error('[Retention] Errore durante la pulizia dati:', error)
  }
}
