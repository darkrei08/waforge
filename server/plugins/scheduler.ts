import { prisma } from '../utils/prisma'
import { startCampaign } from '../utils/job-queue'

export default defineNitroPlugin((nitroApp) => {
  // Run every 60 seconds
  setInterval(async () => {
    try {
      const now = new Date()
      const scheduledCampaigns = await prisma.campaign.findMany({
        where: { 
          status: 'SCHEDULED', 
          scheduledAt: { lte: now } 
        }
      })
      
      for (const campaign of scheduledCampaigns) {
        console.log(`[Scheduler] Starting scheduled campaign: ${campaign.name} (${campaign.id})`)
        await startCampaign(campaign.id, campaign.teamId)
      }
    } catch (e) {
      console.error('[Scheduler] Error checking scheduled campaigns:', e)
    }
  }, 60000)
})
