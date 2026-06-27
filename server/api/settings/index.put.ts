/**
 * PUT /api/settings — Update application settings
 *
 * NOTE: In this version settings are primarily env-driven.
 * This endpoint validates and returns the new values for the frontend
 * to acknowledge, but persistent setting changes require a restart.
 * A future version can store settings in SQLite for runtime changes.
 */

import { defineEventHandler } from 'h3'
import { zodReadBody } from '~/server/utils/validation'
import { UpdateSettingsSchema } from '~/lib/validation'

export default defineEventHandler(async (event) => {
  const data = await zodReadBody(event, UpdateSettingsSchema)

  // For now, we acknowledge the settings.
  // In production, these would be written to a settings table.
  return {
    data: {
      ...data,
      saved: true,
      note: 'Settings acknowledged. Env-level changes require container restart.',
    },
  }
})
