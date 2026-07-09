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

export const ENGINE = (process.env.WHATSAPP_ENGINE || 'gowa') as 'wuzapi' | 'gowa'

const ENDPOINTS = {
  wuzapi: {
    base: process.env.WUZAPI_URL || 'http://wuzapi:8080',
    sendText: '/chat/send/text',
    status: '/app/status',
    qr: '/app/qrcode',
    logout: '/user/logout',
  },
  gowa: {
    base: process.env.GOWA_URL || 'http://gowa:3000',
    sendText: '/send/message',
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

  // gowa uses Basic Auth (admin:secret) and requires X-Device-Id
  if (ENGINE === 'gowa') {
    const gowaToken = process.env.GOWA_TOKEN || 'secret-token'
    headers['Authorization'] = `Basic ${Buffer.from(`admin:${gowaToken}`).toString('base64')}`
    headers['X-Device-Id'] = token
  }

  try {
    const res = await $fetch(`${cfg.base}${path}`, {
      method: method as any,
      headers,
      body: body ? body : undefined,
    })

    // Auto-provision gowa device for fresh setups (if returns 200 with code DEVICE_NOT_FOUND)
    if (ENGINE === 'gowa' && res && res.code === 'DEVICE_NOT_FOUND' && retry) {
      try {
        await $fetch(`${cfg.base}/devices`, {
          method: 'POST',
          headers,
          body: { device_id: token }
        })
        return apiCall(path, token, method, body, false)
      } catch (e) {
        // Ignore and fall through
      }
    }
    return res
  } catch (err: any) {
    if (err.response) {
      const status = err.response.status
      const data = err.response._data || {}

      if (status === 401 && ENGINE === 'wuzapi' && retry) {
        try {
          await $fetch(`${cfg.base}/admin/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': process.env.WUZAPI_TOKEN || '',
            },
            body: { name: 'WaForge Team User', token }
          })
          return apiCall(path, token, method, body, false)
        } catch (e) {
          // Ignore and fall through to throw original error
        }
      }

      if (data && data.code !== 'DEVICE_NOT_FOUND') {
        throw new Error(`[${ENGINE}] ${status}: ${JSON.stringify(data)}`)
      }

      // Auto-provision gowa device for fresh setups (if returns error with code DEVICE_NOT_FOUND)
      if (ENGINE === 'gowa' && data.code === 'DEVICE_NOT_FOUND' && retry) {
        try {
          await $fetch(`${cfg.base}/devices`, {
            method: 'POST',
            headers,
            body: { device_id: token }
          })
          return apiCall(path, token, method, body, false)
        } catch (e) {
          // Ignore and fall through
        }
      }

      return data
    }
    throw err
  }
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
        connected: data.results?.is_connected ?? data.Connected ?? false,
        loggedIn: data.results?.is_logged_in ?? data.LoggedIn ?? false,
        phone: data.results?.jid?.split('@')[0] ?? data.Jid?.split('@')[0],
        engine: 'go-whatsapp-web-multidevice',
      }
    }
  } catch {
    return { connected: false, loggedIn: false, engine: ENGINE }
  }
}

export async function getQRCode(token: string): Promise<string | null> {
  try {
    // WuzAPI uses GET /app/qrcode; GoWA uses GET /app/login to initiate QR
    const method = 'GET'
    const data = await apiCall(cfg.qr, token, method)
    
    if (ENGINE === 'wuzapi') {
      const qr = data.data?.QRCode ?? data.QRCode ?? null
      if (qr && !qr.startsWith('data:image')) {
        return `data:image/png;base64,${qr}`
      }
      return qr
    } else {
      // GoWA v8 returns a URL to the PNG in data.results.qr_link
      const qrLink = data.results?.qr_link ?? data.data?.qr_link ?? data.qr_link
      if (qrLink) {
        // Fetch the image from the engine and return it as base64 data URI
        // so the frontend doesn't need to directly access the engine's port
        // Also replace localhost with gowa container name if needed
        const fetchUrl = qrLink
          .replace('localhost:3000', 'gowa:3000')
          .replace('localhost:3200', 'gowa:3000')
          .replace('127.0.0.1:3000', 'gowa:3000')
        const gowaToken = process.env.GOWA_TOKEN || 'secret-token'
        const imgRes = await fetch(fetchUrl, {
          headers: {
            'Authorization': `Basic ${Buffer.from(`admin:${gowaToken}`).toString('base64')}`
          }
        })
        if (!imgRes.ok) return null
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
    
    // Clean phone number: remove +, spaces, dashes
    let cleanPhone = phone.replace(/[\+\s\-]/g, '')
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2)
    // Se inizia con 3 ed è lungo 10 cifre, probabile numero italiano senza prefisso (assunzione per comodità)
    if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
      cleanPhone = `39${cleanPhone}`
    }

    if (ENGINE === 'wuzapi') {
      body = {
        Phone: `${cleanPhone}@s.whatsapp.net`,
        Body: message,
      }
    } else {
      // gowa format
      body = {
        phone: cleanPhone,
        message: message,
      }
    }

    const data = await apiCall(cfg.sendText, token, 'POST', body)
    const msgId = data.data?.Id ?? data.MessageId ?? 'ok'
    return { success: true, messageId: msgId }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function sendMedia(
  token: string,
  phone: string,
  mediaType: 'image' | 'video' | 'audio' | 'document',
  fileUrl: string,
  caption?: string
): Promise<SendResult> {
  try {
    let cleanPhone = phone.replace(/[\+\s\-]/g, '')
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2)
    if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
      cleanPhone = `39${cleanPhone}`
    }

    let endpoint = ''
    let body: Record<string, unknown> = {}

    if (ENGINE === 'wuzapi') {
      endpoint = `/chat/send/${mediaType}`
      body = {
        Phone: `${cleanPhone}@s.whatsapp.net`,
        Url: fileUrl,
        Caption: caption || ''
      }
    } else {
      // GOWA format
      endpoint = `/send/${mediaType}`
      body = {
        phone: cleanPhone,
        [mediaType]: fileUrl, // expects e.g. "image": "http://..."
        caption: caption || ''
      }
    }

    const data = await apiCall(endpoint, token, 'POST', body)
    const msgId = data.data?.Id ?? data.MessageId ?? data.results?.message_id ?? 'ok'
    return { success: true, messageId: msgId }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function disconnectEngine(token: string): Promise<void> {
  if (ENGINE === 'gowa') {
    await apiCall(`/devices/${token}`, token, 'DELETE')
  } else {
    await apiCall(cfg.logout, token, 'POST')
  }
}
export async function checkPhone(token: string, phone: string): Promise<boolean> {
  try {
    let cleanPhone = phone.replace(/[\+\s\-]/g, '')
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2)
    if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
      cleanPhone = `39${cleanPhone}`
    }

    if (ENGINE === 'wuzapi') {
      const data = await apiCall('/chat/check/phone', token, 'POST', {
        Phone: `${cleanPhone}@s.whatsapp.net`
      })
      return data.data?.OnWhatsApp ?? true // Fallback true se l'API non risponde correttamente
    } else {
      // GoWA v8 exposes /app/contacts/check or similar, but we fallback to assuming true if we don't know the exact endpoint
      // A common WhatsMeow wrapper endpoint for checking is /user/info or /app/contacts/check
      try {
        const data = await apiCall('/user/info', token, 'GET', { phone: cleanPhone })
        if (data && data.results) return true
      } catch (e) {
        // Fallback
      }
      return true // Lazy default per GoWA se non supportato per evitare di bloccare l'invio
    }
  } catch (err) {
    return true // Se l'API fallisce (es. offline), non blocchiamo la campagna preventivamente
  }
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

// ENGINE is already exported at declaration
