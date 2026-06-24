/**
 * GET /api/whatsapp/qr — Get QR code for WhatsApp login
 * Supports dual engine (WuzAPI / gowa)
 */

import { defineEventHandler } from 'h3'
import { getQRCode, ENGINE } from '~/lib/whatsapp-engine'

export default defineEventHandler(async () => {
  const token = ENGINE === 'wuzapi'
    ? (process.env.WUZAPI_TOKEN || 'secret-token')
    : (process.env.GOWA_TOKEN || 'secret-token')
  const qrCode = await getQRCode(token)

  return {
    data: {
      qrCode,
      available: !!qrCode,
    },
  }
})
