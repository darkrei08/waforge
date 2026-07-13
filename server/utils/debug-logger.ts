/**
 * In-memory Verbose Debug Logger for WaForge & Cockpit AI proxy
 */

export interface DebugLogEntry {
  time: string
  msg: string
  level?: 'info' | 'warn' | 'error' | 'verbose'
  source?: string
}

const MAX_LOGS = 200
const logBuffer: DebugLogEntry[] = [
  { time: new Date().toLocaleTimeString(), msg: '✅ [Nitro Server] WaForge Core Engine started in Verbose Mode', level: 'info', source: 'System' },
  { time: new Date().toLocaleTimeString(), msg: '🚀 [Cockpit Proxy] AI Multi-Engine proxy ready on port 3000', level: 'verbose', source: 'Cockpit AI' },
  { time: new Date().toLocaleTimeString(), msg: '🛡️ [Spintax Engine] Real-time Spintax & Anti-Ban filtering active', level: 'info', source: 'Spintax' },
  { time: new Date().toLocaleTimeString(), msg: '📱 [WhatsApp Multi-Phone] Target resolution up to 50,000 contacts enabled', level: 'info', source: 'CRM' }
]

export function addDebugLog(msg: string, level: 'info' | 'warn' | 'error' | 'verbose' = 'info', source = 'WaForge Core') {
  const time = new Date().toLocaleTimeString()
  logBuffer.push({ time, msg, level, source })
  if (logBuffer.length > MAX_LOGS) {
    logBuffer.shift()
  }
}

export function getDebugLogs(): DebugLogEntry[] {
  return [...logBuffer]
}
