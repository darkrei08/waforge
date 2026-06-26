/**
 * WuzAPI Client — REST wrapper for asternic/wuzapi
 * Docs: https://github.com/asternic/wuzapi
 */

const WUZAPI_URL = process.env.WUZAPI_URL || 'http://wuzapi:8080'
const WUZAPI_TOKEN = process.env.WUZAPI_TOKEN || ''

const defaultHeaders = {
  'Content-Type': 'application/json',
  'token': WUZAPI_TOKEN,
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${WUZAPI_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { ...defaultHeaders, ...(options.headers || {}) },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`WuzAPI error [${res.status}]: ${text}`)
  }
  return res.json() as Promise<T>
}

// ── Session ───────────────────────────────────────────────────────────────────

export interface WuzApiStatus {
  data: {
    Connected: boolean
    LoggedIn: boolean
    Webhook: string
    Jid?: string
  }
}

export interface WuzApiQR {
  data: {
    QRCode?: string  // base64 PNG
    Connected?: boolean
  }
}

export async function getStatus(): Promise<WuzApiStatus> {
  return request<WuzApiStatus>('/app/status')
}

export async function getQRCode(): Promise<WuzApiQR> {
  return request<WuzApiQR>('/app/qrcode')
}

export async function connectSession(userToken: string): Promise<void> {
  await request('/user/login', {
    method: 'POST',
    body: JSON.stringify({ token: userToken }),
  })
}

export async function disconnectSession(): Promise<void> {
  await request('/user/logout', { method: 'POST' })
}

// ── Messaging ─────────────────────────────────────────────────────────────────

export interface SendTextResponse {
  data: {
    Details: string
    Id: string
  }
  code: number
}

/**
 * Send a plain text message to a phone number
 * @param phone full international number with country code (e.g. "393331234567")
 * @param message message text (supports WhatsApp markdown: *bold*, _italic_)
 */
export async function sendText(
  phone: string,
  message: string
): Promise<SendTextResponse> {
  return request<SendTextResponse>('/chat/send/text', {
    method: 'POST',
    body: JSON.stringify({
      Phone: `${phone}@s.whatsapp.net`,
      Body: message,
    }),
  })
}

/**
 * Check if a phone number exists on WhatsApp
 */
export async function checkPhone(phone: string): Promise<boolean> {
  try {
    const res = await request<{ data: { OnWhatsApp: boolean } }>('/chat/check/phone', {
      method: 'POST',
      body: JSON.stringify({ Phone: `${phone}@s.whatsapp.net` }),
    })
    return res.data.OnWhatsApp
  } catch {
    return false
  }
}

// ── Template Rendering ────────────────────────────────────────────────────────

/**
 * Render a message template by substituting {{variable}} placeholders
 * with values from the contact object
 */
export function renderTemplate(
  template: string,
  contact: Record<string, string | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(contact[key] ?? contact[key.toLowerCase()] ?? `{{${key}}}`)
  })
}
