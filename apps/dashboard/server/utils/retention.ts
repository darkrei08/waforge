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

    // Elimina sessioni "fantasma" (QR generato ma mai scansionato) dopo 1 ora
    const unOraFa = new Date()
    unOraFa.setHours(unOraFa.getHours() - 1)
    
    const deletedGhostSessions = await prisma.whatsAppSession.deleteMany({
      where: {
        status: 'disconnected',
        phone: null,
        updatedAt: {
          lt: unOraFa
        }
      }
    })
    console.log(`[Retention] Sessioni fantasma eliminate: ${deletedGhostSessions.count}`)

    console.log('[Retention] Pulizia completata con successo.')
  } catch (error) {
    console.error('[Retention] Errore durante la pulizia dati:', error)
  }
}
