import fs from 'node:fs'
import path from 'node:path'
import { addDebugLog } from './debug-logger'

export interface CrikketBugReport {
  id?: string
  title: string
  description: string
  stack?: string
  source?: string
  level?: 'warn' | 'error' | 'critical'
  environment?: any
  metadata?: any
  createdAt?: string
}

const LOCAL_STORAGE_DIR = path.resolve(process.cwd(), '.system_generated')
const LOCAL_STORAGE_PATH = path.join(LOCAL_STORAGE_DIR, 'crikket_reports.json')

// Assicura che la directory di backup locale per AI esista
if (!fs.existsSync(LOCAL_STORAGE_DIR)) {
  try {
    fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true })
  } catch (e) {}
}

export async function reportBugToCrikket(report: CrikketBugReport) {
  const payload = {
    id: report.id || `CRIKKET-${Date.now()}-${Math.floor(Math.random()*1000)}`,
    title: report.title || 'Eccezione inattesa WaForge',
    description: report.description || 'Nessuna descrizione specificata',
    stack: report.stack || '',
    source: report.source || 'WaForge Nitro / Vue',
    level: report.level || 'error',
    environment: report.environment || {
      nodeEnv: process.env.NODE_ENV || 'development',
      dockerLevels: {
        waforge: process.env.LOG_LEVEL_WAFORGE || 'verbose',
        wuzapi: process.env.LOG_LEVEL_WUZAPI || 'info'
      }
    },
    metadata: report.metadata || {},
    createdAt: new Date().toISOString()
  }

  // 1. Memorizza in locale (.system_generated/crikket_reports.json) come base per AI Copilot / Cockpit
  try {
    let existing: any[] = []
    if (fs.existsSync(LOCAL_STORAGE_PATH)) {
      const content = fs.readFileSync(LOCAL_STORAGE_PATH, 'utf-8')
      try { existing = JSON.parse(content) } catch (e) { existing = [] }
    }
    existing.unshift(payload)
    // tieni gli ultimi 200 report
    if (existing.length > 200) existing = existing.slice(0, 200)
    fs.writeFileSync(LOCAL_STORAGE_PATH, JSON.stringify(existing, null, 2))
  } catch (err) {
    console.error('[Crikket Client] Errore di salvataggio locale:', err)
  }

  // 2. Aggiungi anche ai log in memoria del Debug Logger
  addDebugLog(`[Crikket Tracker] Nuovo bug registrato: ${payload.title} (${payload.source})`, 'error', 'Crikket')

  // 3. Invia a Crikket Server API (se raggiungibile su http://crikket-server:3000 o porta locale 3150)
  const crikketServerUrl = process.env.CRIKKET_SERVER_URL || 'http://crikket-server:3000'
  try {
    const response = await fetch(`${crikketServerUrl}/api/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Crikket-Source': 'waforge'
      },
      body: JSON.stringify(payload)
    })
    if (response.ok) {
      addDebugLog(`[Crikket Tracker] Report sincronizzato con Crikket Server API`, 'verbose', 'Crikket')
      return { success: true, storedLocally: true, syncedWithServer: true, report: payload }
    } else {
      return { success: true, storedLocally: true, syncedWithServer: false, report: payload }
    }
  } catch (e: any) {
    // Se Crikket Server container non è ancora online, il salvataggio locale (.system_generated/crikket_reports.json) garantisce comunque la persistenza per AI e Cockpit!
    return { success: true, storedLocally: true, syncedWithServer: false, report: payload, error: e.message }
  }
}

export function getLocalCrikketReports(): CrikketBugReport[] {
  try {
    if (fs.existsSync(LOCAL_STORAGE_PATH)) {
      const content = fs.readFileSync(LOCAL_STORAGE_PATH, 'utf-8')
      return JSON.parse(content)
    }
  } catch (e) {}
  return []
}
