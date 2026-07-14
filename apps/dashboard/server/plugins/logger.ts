import { defineNitroPlugin } from 'nitropack/runtime/plugin'

// In-memory store for debug widget logs
export const systemLogs: { time: string; msg: string; level: 'info' | 'warn' | 'error' }[] = []

function addLog(level: 'info' | 'warn' | 'error', ...args: any[]) {
  const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
  
  // Also print to actual console
  if (level === 'error') {
    process.stdout.write(`\x1b[31m[DEBUG]\x1b[0m ${msg}\n`)
  } else if (level === 'warn') {
    process.stdout.write(`\x1b[33m[DEBUG]\x1b[0m ${msg}\n`)
  } else {
    process.stdout.write(`\x1b[32m[DEBUG]\x1b[0m ${msg}\n`)
  }

  systemLogs.push({
    time: new Date().toLocaleTimeString(),
    msg,
    level
  })

  // Keep only last 100 logs
  if (systemLogs.length > 100) {
    systemLogs.shift()
  }
}

export default defineNitroPlugin((nitroApp) => {
  // Override console methods in nitro
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error

  console.log = function(...args) {
    addLog('info', ...args)
    // originalLog.apply(console, args)
  }

  console.warn = function(...args) {
    addLog('warn', ...args)
    // originalWarn.apply(console, args)
  }

  console.error = function(...args) {
    addLog('error', ...args)
    // originalError.apply(console, args)
  }
  
  console.log('Nitro Runtime Logger Initialized for Debug Widget')
})
