import { prisma } from '../server/utils/prisma'

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
    return true; // Indicates policy was changed
  }
  
  if (normalizedText === 'STOP' || normalizedText === 'STOP ALL') {
    await prisma.contact.updateMany({
      where: { fullPhone, teamId },
      data: { optInMarketing: false, optInTransactional: false, consentStatus: 'DENIED' }
    });
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
    return true;
  }

  return false;
}
