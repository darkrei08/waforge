/**
 * GET /api/settings — Get current application settings
 */

import { defineEventHandler } from 'h3'
import { ENGINE } from '~/lib/whatsapp-engine'

export default defineEventHandler(async () => {
  return {
    data: {
      delayMin: parseInt(process.env.CAMPAIGN_DELAY_MIN || '15', 10),
      delayMax: parseInt(process.env.CAMPAIGN_DELAY_MAX || '45', 10),
      maxMessagesPerHour: parseInt(process.env.MAX_MESSAGES_PER_HOUR || '100', 10),
      spintaxEnabled: process.env.SPINTAX_ENABLED !== 'false',
      whatsappEngine: ENGINE,
      supportedEngines: ['wuzapi', 'gowa', 'openwa', 'hybrid'],
    },
  }
})
