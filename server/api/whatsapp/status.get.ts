/**
 * GET /api/whatsapp/status — Get WhatsApp engine connection status
 * Supports dual engine (WuzAPI / gowa)
 */

import { defineEventHandler } from 'h3'
import { getEngineStatus, ENGINE } from '~/lib/whatsapp-engine'

export default defineEventHandler(async () => {
  const token = ENGINE === 'wuzapi'
    ? (process.env.WUZAPI_TOKEN || 'secret-token')
    : (process.env.GOWA_TOKEN || 'secret-token')
  const status = await getEngineStatus(token)

  return {
    data: {
      ...status,
      activeEngine: ENGINE,
      supportedEngines: ['wuzapi', 'gowa'],
    },
  }
})
