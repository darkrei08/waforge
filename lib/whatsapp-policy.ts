import { prisma } from '../server/utils/prisma'
import { broadcastToTeam } from '../server/routes/ws'

export interface ContactPolicy {
  optInMarketing: boolean;
  optInTransactional: boolean;
}

/**
 * Get the communication policy for a specific phone number.
 * Defaults to true if the contact is not found.
 */
export async function getPolicyForContact(fullPhone: string): Promise<ContactPolicy | null> {
  // Ideally, you'd match the contact. For simplicity, we just find the first match by phone.
  // In a robust system, you'd query by teamId + fullPhone.
  const contact = await prisma.contact.findFirst({
    where: { fullPhone }
  });

  if (!contact) {
    return null; // Let the caller decide the default behavior
  }

  return {
    optInMarketing: contact.optInMarketing,
    optInTransactional: contact.optInTransactional
  };
}

/**
 * Handle incoming message text to update policy based on keywords (e.g. STOP, START).
 */
export async function handleOptOutKeywords(fullPhone: string, text: string, teamId: string) {
  const normalizedText = text.trim().toUpperCase();
  
  if (normalizedText === 'STOP MARKETING') {
    await prisma.contact.updateMany({
      where: { fullPhone, teamId },
      data: { optInMarketing: false, consentStatus: 'DENIED' }
    });
    await trackCampaignOptOut(fullPhone, teamId);
    return true; // Indicates policy was changed
  }
  
  if (normalizedText === 'STOP' || normalizedText === 'STOP ALL') {
    await prisma.contact.updateMany({
      where: { fullPhone, teamId },
      data: { optInMarketing: false, optInTransactional: false, consentStatus: 'DENIED' }
    });
    await trackCampaignOptOut(fullPhone, teamId);
    return true;
  }

  if (normalizedText === 'START' || normalizedText === 'SI') {
    await prisma.contact.updateMany({
      where: { fullPhone, teamId },
      data: { optInMarketing: true, optInTransactional: true, consentStatus: 'GRANTED' }
    });
    return true;
  }

  if (normalizedText === 'NO') {
    await prisma.contact.updateMany({
      where: { fullPhone, teamId },
      data: { consentStatus: 'DENIED' }
    });
    await trackCampaignOptOut(fullPhone, teamId);
    return true;
  }

  return false;
}

/**
 * Identify if the opt-out was triggered by a recent campaign message and track it.
 */
async function trackCampaignOptOut(fullPhone: string, teamId: string) {
  // Find the contact first
  const contact = await prisma.contact.findUnique({
    where: { teamId_fullPhone: { teamId, fullPhone } }
  });
  if (!contact) return;

  // Find the most recent message sent to this contact from a campaign (within 72 hours)
  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const recentMessage = await prisma.message.findFirst({
    where: {
      contactId: contact.id,
      campaignId: { not: null },
      createdAt: { gte: seventyTwoHoursAgo }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (recentMessage && recentMessage.campaignId) {
    // Increment the optOutCount for the campaign
    const updatedCampaign = await prisma.campaign.update({
      where: { id: recentMessage.campaignId },
      data: { optOutCount: { increment: 1 } }
    });
    
    // Broadcast real-time update
    broadcastToTeam(teamId, 'campaign_updated', updatedCampaign);
  }
}
