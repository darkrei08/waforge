/**
 * WhatsApp Engine Abstraction Layer
 *
 * Supports two backends:
 *   - PRIMARY:  WuzAPI  (asternic/wuzapi)      → http://wuzapi:3100
 *   - FALLBACK: go-whatsapp-web-multidevice    → http://gowa:3000
 *
 * Both expose compatible REST endpoints (whatsmeow under the hood).
 * Switch via env var: WHATSAPP_ENGINE=wuzapi | gowa
 */

const ENGINE = (process.env.WHATSAPP_ENGINE || 'wuzapi') as 'wuzapi' | 'gowa'

const ENDPOINTS = {
  wuzapi: {
    base: process.env.WUZAPI_URL || 'http://wuzapi:3100',
    sendText: '/chat/send/text',
    status: '/app/status',
    qr: '/app/qrcode',
    logout: '/user/logout',
  },
  gowa: {
    base: process.env.GOWA_URL || 'http://gowa:3000',
    sendText: '/app/send/message',
    status: '/app/status',
    qr: '/app/login',
    logout: '/app/logout',
  },
}

const cfg = ENDPOINTS[ENGINE]

interface SendResult {
  success: boolean
  messageId?: string
  error?: string
}

interface EngineStatus {
  connected: boolean
  loggedIn: boolean
  phone?: string
  engine: string
}

async function apiCall(path: string, token: string, method = 'GET', body?: unknown, retry = true): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    token,
  }

  // gowa uses Basic Auth (admin:token) and requires X-Device-Id
  if (ENGINE === 'gowa') {
    headers['Authorization'] = `Basic ${Buffer.from(`admin:${token}`).toString('base64')}`
    headers['X-Device-Id'] = 'waforge-default'
  }

  const res = await fetch(`${cfg.base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })

  let data: any
  
  if (!res.ok) {
    if (res.status === 401 && ENGINE === 'wuzapi' && retry) {
      // Auto-provision user for fresh Docker setups
      try {
        await fetch(`${cfg.base}/admin/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.WUZAPI_TOKEN || 'secret-token',
          },
          body: JSON.stringify({ name: 'WaForge Team User', token })
        })
        return apiCall(path, token, method, body, false)
      } catch (e) {
        // Ignore and fall through to throw original error
      }
    }

    try {
      data = await res.json()
    } catch {
      const txt = await res.text()
      throw new Error(`[${ENGINE}] ${res.status}: ${txt}`)
    }
    
    // Fallback if no specific code is handled
    if (data.code !== 'DEVICE_NOT_FOUND') {
      throw new Error(`[${ENGINE}] ${res.status}: ${JSON.stringify(data)}`)
    }
  } else {
    data = await res.json()
  }

  // Auto-provision gowa device for fresh setups
  if (ENGINE === 'gowa' && data.code === 'DEVICE_NOT_FOUND' && retry) {
    try {
      await fetch(`${cfg.base}/devices`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ device_id: 'waforge-default' })
      })
      return apiCall(path, token, method, body, false)
    } catch (e) {
      // Ignore and fall through
    }
  }

  return data
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function getEngineStatus(token: string): Promise<EngineStatus> {
  try {
    const data = await apiCall(cfg.status, token)

    if (ENGINE === 'wuzapi') {
      return {
        connected: data.data?.Connected ?? false,
        loggedIn: data.data?.LoggedIn ?? false,
        phone: data.data?.Jid?.split('@')[0],
        engine: 'WuzAPI',
      }
    } else {
      return {
        connected: data.Connected ?? false,
        loggedIn: data.LoggedIn ?? false,
        phone: data.Jid?.split('@')[0],
        engine: 'go-whatsapp-web-multidevice',
      }
    }
  } catch {
    return { connected: false, loggedIn: false, engine: ENGINE }
  }
}

export async function getQRCode(token: string): Promise<string | null> {
  try {
    const data = await apiCall(cfg.qr, token)
    
    if (ENGINE === 'wuzapi') {
      const qr = data.data?.QRCode ?? data.QRCode ?? null
      if (qr && !qr.startsWith('data:image')) {
        return `data:image/png;base64,${qr}`
      }
      return qr
    } else {
      // GoWA v8 returns a URL to the PNG in data.results.qr_link
      const qrLink = data.results?.qr_link
      if (qrLink) {
        // Fetch the image from the engine and return it as base64 data URI
        // so the frontend doesn't need to directly access the engine's port
        // Also replace localhost with gowa container name if needed
        const fetchUrl = qrLink.replace('localhost:3000', 'gowa:3000').replace('localhost:3200', 'gowa:3000')
        const imgRes = await fetch(fetchUrl)
        const arrayBuffer = await imgRes.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        return `data:image/png;base64,${buffer.toString('base64')}`
      }
      return null
    }
  } catch {
    return null
  }
}

export async function sendMessage(
  token: string,
  phone: string,
  message: string
): Promise<SendResult> {
  try {
    let body: Record<string, unknown>

    if (ENGINE === 'wuzapi') {
      body = {
        Phone: `${phone}@s.whatsapp.net`,
        Body: message,
      }
    } else {
      // gowa format
      body = {
        Phone: `${phone}@s.whatsapp.net`,
        Message: message,
      }
    }

    const data = await apiCall(cfg.sendText, token, 'POST', body)
    const msgId = data.data?.Id ?? data.MessageId ?? 'ok'
    return { success: true, messageId: msgId }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function disconnectEngine(token: string): Promise<void> {
  await apiCall(cfg.logout, token, 'POST')
}

/** Render template: replace {{Variable}} with contact field values */
export function renderTemplate(
  template: string,
  fields: Record<string, string | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(fields[key] ?? fields[key.toLowerCase()] ?? `{{${key}}}`)
  })
}

export { ENGINE }
