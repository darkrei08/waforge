import { defineEventHandler } from 'h3'
import { getDebugLogs, addDebugLog } from '~/server/utils/debug-logger'
import { prisma } from '~/server/utils/prisma'

export default defineEventHandler(async (event) => {
  try {
    const logs = getDebugLogs()
    const logLevels = {
      waforge: process.env.LOG_LEVEL || process.env.LOG_LEVEL_WAFORGE || 'verbose',
      wuzapi: process.env.LOG_LEVEL_WUZAPI || 'info',
      gowa: process.env.LOG_LEVEL_GOWA || 'info',
      openwa: process.env.LOG_LEVEL_OPENWA || 'info',
      cockpit: process.env.LOG_LEVEL_COCKPIT || 'info',
      mcp: process.env.LOG_LEVEL_MCP || 'info',
    }

    return {
      success: true,
      logLevels,
      logs: logs.map(l => ({
        time: l.time,
        msg: l.source ? `[${l.source}] ${l.msg}` : l.msg,
        level: l.level,
        source: l.source || 'WaForge'
      }))
    }
  } catch (error: any) {
    return {
      success: false,
      logLevels: { waforge: 'error' },
      logs: [
        { time: new Date().toLocaleTimeString(), msg: `[Error fetching debug logs]: ${error.message}`, level: 'error', source: 'System' }
      ]
    }
  }
})
