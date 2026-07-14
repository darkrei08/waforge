/**
 * WhatsApp Engine Abstraction Layer
 *
 * Supports four modes:
 *   - PRIMARY:  WuzAPI  (asternic/wuzapi)      → http://wuzapi:8080
 *   - FALLBACK: go-whatsapp-web-multidevice    → http://gowa:3000
 *   - COMPANION: OpenWA (rmyndharis/OpenWA)    → http://openwa:2785/api
 *   - HYBRID:   Multi-Engine Load Balancer & Real-time Failover across all connected engines
 *
 * Switch via env var: WHATSAPP_ENGINE=wuzapi | gowa | openwa | hybrid
 */

export type SupportedEngine = 'wuzapi' | 'gowa' | 'openwa' | 'hybrid'
export const ENGINE = (process.env.WHATSAPP_ENGINE || 'hybrid') as SupportedEngine

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
  openwa: {
    base: process.env.OPENWA_URL || 'http://openwa:2785/api',
    sendText: '/messages/send-text',
    status: '/status',
    qr: '/qr',
    logout: '/stop',
  },
}

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

const ACTIVE_ENGINES: ('wuzapi' | 'gowa' | 'openwa')[] = ['wuzapi', 'gowa', 'openwa']
let roundRobinIndex = 0

async function apiCall(
  path: string,
  token: string,
  method = 'GET',
  body?: unknown,
  retry = true,
  targetEngine: 'wuzapi' | 'gowa' | 'openwa' = ENGINE === 'hybrid' ? 'wuzapi' : (ENGINE as any)
): Promise<any> {
  const cfg = ENDPOINTS[targetEngine] || ENDPOINTS.wuzapi
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  let finalPath = path
  if (targetEngine === 'wuzapi' || targetEngine === 'gowa') {
    headers['token'] = token
  }

  if (targetEngine === 'gowa') {
    const gowaToken = process.env.GOWA_TOKEN || 'secret-token'
    headers['Authorization'] = `Basic ${Buffer.from(`admin:${gowaToken}`).toString('base64')}`
    headers['X-Device-Id'] = token
  } else if (targetEngine === 'openwa') {
    headers['X-API-Key'] = process.env.OPENWA_API_KEY || 'owa_k1_secret'
    if (!finalPath.startsWith('/sessions/')) {
      finalPath = `/sessions/${token}${finalPath}`
    }
  }

  try {
    const res = await $fetch(`${cfg.base}${finalPath}`, {
      method: method as any,
      headers,
      body: body ? body : undefined,
    })

    if (targetEngine === 'gowa' && res && res.code === 'DEVICE_NOT_FOUND' && retry) {
      try {
        await $fetch(`${cfg.base}/devices`, {
          method: 'POST',
          headers,
          body: { device_id: token }
        })
        return apiCall(path, token, method, body, false, targetEngine)
      } catch (e) {
        // Ignore and fall through
      }
    }
    return res
  } catch (err: any) {
    if (err.response) {
      const status = err.response.status
      const data = err.response._data || {}

      if (status === 401 && targetEngine === 'wuzapi' && retry) {
        try {
          await $fetch(`${cfg.base}/admin/users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': process.env.WUZAPI_TOKEN || '',
            },
            body: { name: 'WaForge Team User', token }
          })
          return apiCall(path, token, method, body, false, targetEngine)
        } catch (e) {
          // Ignore and fall through
        }
      }

      if ((status === 404 || status === 400) && targetEngine === 'openwa' && retry) {
        try {
          await $fetch(`${cfg.base}/sessions/${token}/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': process.env.OPENWA_API_KEY || 'owa_k1_secret'
            },
            body: { sessionId: token }
          })
          return apiCall(path, token, method, body, false, targetEngine)
        } catch (e) {
          // Ignore and fall through
        }
      }

      if (data && data.code !== 'DEVICE_NOT_FOUND') {
        throw new Error(`[${targetEngine}] ${status}: ${JSON.stringify(data)}`)
      }

      if (targetEngine === 'gowa' && data.code === 'DEVICE_NOT_FOUND' && retry) {
        try {
          await $fetch(`${cfg.base}/devices`, {
            method: 'POST',
            headers,
            body: { device_id: token }
          })
          return apiCall(path, token, method, body, false, targetEngine)
        } catch (e) {
          // Ignore
        }
      }

      return data
    }
    throw err
  }
}

// ── Single Engine Helpers ─────────────────────────────────────────────────────

async function getEngineStatusSingle(token: string, target: 'wuzapi' | 'gowa' | 'openwa'): Promise<EngineStatus> {
  try {
    const cfg = ENDPOINTS[target]
    const data = await apiCall(cfg.status, token, 'GET', undefined, true, target)

    if (target === 'wuzapi') {
      const isConnected = Boolean(data?.data?.Connected || data?.data?.connected || data?.Connected || data?.connected || data?.data?.LoggedIn || data?.data?.logged_in)
      const isLoggedIn = Boolean(data?.data?.LoggedIn || data?.data?.logged_in || data?.LoggedIn || data?.logged_in || isConnected)
      return {
        connected: isConnected,
        loggedIn: isLoggedIn,
        phone: data?.data?.Jid?.split('@')[0] || data?.data?.jid?.split('@')[0] || data?.Jid?.split('@')[0] || undefined,
        engine: 'WuzAPI',
      }
    } else if (target === 'gowa') {
      const isConnected = Boolean(data?.results?.is_connected || data?.results?.connected || data?.Connected || data?.connected || data?.results?.is_logged_in || data?.results?.logged_in || data?.LoggedIn || data?.logged_in)
      const isLoggedIn = Boolean(data?.results?.is_logged_in || data?.results?.logged_in || data?.LoggedIn || data?.logged_in || isConnected)
      return {
        connected: isConnected,
        loggedIn: isLoggedIn,
        phone: data?.results?.jid?.split('@')[0] || data?.results?.phone?.split('@')[0] || data?.Jid?.split('@')[0] || data?.phone?.split('@')[0] || undefined,
        engine: 'go-whatsapp-web-multidevice',
      }
    } else {
      const isConnected = data?.status === 'CONNECTED' || data?.status === 'AUTHENTICATED' || data?.connected === true || data?.loggedIn === true
      const isLoggedIn = data?.status === 'CONNECTED' || data?.status === 'AUTHENTICATED' || data?.loggedIn === true || isConnected
      return {
        connected: isConnected,
        loggedIn: isLoggedIn,
        phone: data?.phone?.split('@')[0] ?? data?.id?.split('@')[0] ?? null,
        engine: 'OpenWA',
      }
    }
  } catch {
    return { connected: false, loggedIn: false, engine: target }
  }
}

async function getQRCodeSingle(token: string, target: 'wuzapi' | 'gowa' | 'openwa'): Promise<string | null> {
  try {
    const cfg = ENDPOINTS[target]
    const data = await apiCall(cfg.qr, token, 'GET', undefined, true, target)

    if (target === 'wuzapi') {
      const qr = data.data?.QRCode ?? data.QRCode ?? null
      if (qr && !qr.startsWith('data:image')) {
        return `data:image/png;base64,${qr}`
      }
      return qr
    } else if (target === 'gowa') {
      const qrLink = data.results?.qr_link ?? data.data?.qr_link ?? data.qr_link
      if (qrLink) {
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
        return `data:image/png;base64,${Buffer.from(arrayBuffer).toString('base64')}`
      }
      return null
    } else {
      const qr = data.qr ?? data.qrCode ?? data.data?.qr ?? null
      if (qr && !qr.startsWith('data:image')) {
        return `data:image/png;base64,${qr}`
      }
      return qr
    }
  } catch {
    return null
  }
}

async function sendPresenceSingle(token: string, phone: string, messageLength: number, target: 'wuzapi' | 'gowa' | 'openwa'): Promise<void> {
  try {
    let cleanPhone = phone.replace(/[\+\s\-]/g, '')
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2)
    if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
      cleanPhone = `39${cleanPhone}`
    }

    if (target === 'wuzapi') {
      await apiCall('/chat/presence', token, 'POST', {
        Phone: `${cleanPhone}@s.whatsapp.net`,
        State: 'composing',
      }, true, target)
    } else if (target === 'gowa') {
      await apiCall('/send/presence', token, 'POST', {
        phone: cleanPhone,
        state: 'composing',
      }, true, target)
    } else {
      await apiCall('/presence', token, 'POST', {
        chatId: `${cleanPhone}@c.us`,
        presence: 'composing',
      }, true, target)
    }

    const typingMs = Math.min(6000, Math.max(1500, messageLength * 30))
    const noise = typingMs * (0.8 + Math.random() * 0.4)
    await new Promise(r => setTimeout(r, Math.floor(noise)))
  } catch {
    // Non-blocking best-effort
  }
}

async function checkPhoneSingle(token: string, phone: string, target: 'wuzapi' | 'gowa' | 'openwa'): Promise<boolean> {
  try {
    let cleanPhone = phone.replace(/[\+\s\-]/g, '')
    if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2)
    if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
      cleanPhone = `39${cleanPhone}`
    }

    if (target === 'wuzapi') {
      const data = await apiCall('/chat/check/phone', token, 'POST', {
        Phone: `${cleanPhone}@s.whatsapp.net`
      }, true, target)
      return data.data?.OnWhatsApp ?? true
    } else if (target === 'gowa') {
      try {
        const data = await apiCall('/user/info', token, 'GET', { phone: cleanPhone }, true, target)
        if (data && data.results) return true
      } catch {
        // Fallback
      }
      return true
    } else {
      const data = await apiCall('/check-number', token, 'POST', {
        phone: cleanPhone
      }, true, target)
      return data.exists ?? data.onWhatsApp ?? true
    }
  } catch {
    return true
  }
}

// ── Public API (Multi-Engine & Hybrid Router) ─────────────────────────────────

export async function getEngineStatus(token: string): Promise<EngineStatus> {
  if (ENGINE === 'hybrid') {
    const results = await Promise.allSettled([
      getEngineStatusSingle(token, 'wuzapi'),
      getEngineStatusSingle(token, 'gowa'),
      getEngineStatusSingle(token, 'openwa'),
    ])
    const statuses = results
      .filter((r): r is PromiseFulfilledResult<EngineStatus> => r.status === 'fulfilled')
      .map(r => r.value)

    const anyConnected = statuses.some(s => s.connected)
    const anyLoggedIn = statuses.some(s => s.loggedIn)
    const activeEngines = statuses.filter(s => s.connected).map(s => s.engine)
    const phone = statuses.find(s => s.connected && s.phone)?.phone || statuses.find(s => s.phone)?.phone || undefined

    return {
      connected: anyConnected,
      loggedIn: anyLoggedIn,
      phone,
      engine: activeEngines.length > 0
        ? `Hybrid (${activeEngines.join(' + ')})`
        : 'Hybrid Multi-Engine (WuzAPI + GoWA + OpenWA)',
    }
  }

  return getEngineStatusSingle(token, ENGINE as any)
}

export async function getQRCode(token: string): Promise<string | null> {
  if (ENGINE === 'hybrid') {
    for (const target of ACTIVE_ENGINES) {
      const qr = await getQRCodeSingle(token, target)
      if (qr) return qr
    }
    return null
  }

  return getQRCodeSingle(token, ENGINE as any)
}

export async function sendMessage(
  token: string,
  phone: string,
  message: string
): Promise<SendResult> {
  let cleanPhone = phone.replace(/[\+\s\-]/g, '')
  if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2)
  if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
    cleanPhone = `39${cleanPhone}`
  }

  if (ENGINE === 'hybrid') {
    const startIdx = roundRobinIndex++ % ACTIVE_ENGINES.length
    const errors: string[] = []

    for (let i = 0; i < ACTIVE_ENGINES.length; i++) {
      const target = ACTIVE_ENGINES[(startIdx + i) % ACTIVE_ENGINES.length]
      try {
        await sendPresenceSingle(token, cleanPhone, message.length, target)
        let body: Record<string, unknown>
        let endpoint = ''

        if (target === 'wuzapi') {
          endpoint = ENDPOINTS.wuzapi.sendText
          body = { Phone: `${cleanPhone}@s.whatsapp.net`, Body: message }
        } else if (target === 'gowa') {
          endpoint = ENDPOINTS.gowa.sendText
          body = { phone: cleanPhone, message: message }
        } else {
          endpoint = ENDPOINTS.openwa.sendText
          body = { chatId: `${cleanPhone}@c.us`, text: message }
        }

        const data = await apiCall(endpoint, token, 'POST', body, true, target)
        const msgId = data.data?.Id ?? data.MessageId ?? data.messageId ?? data.id ?? 'ok'
        return { success: true, messageId: `${msgId} [via ${target}]` }
      } catch (err: any) {
        errors.push(`[${target}]: ${err.message || err}`)
      }
    }
    return { success: false, error: `[Hybrid Router All Engines Failed]: ${errors.join(' | ')}` }
  }

  const target = ENGINE as any
  try {
    let body: Record<string, unknown>
    let endpoint = ''

    if (target === 'wuzapi') {
      endpoint = ENDPOINTS.wuzapi.sendText
      body = { Phone: `${cleanPhone}@s.whatsapp.net`, Body: message }
    } else if (target === 'gowa') {
      endpoint = ENDPOINTS.gowa.sendText
      body = { phone: cleanPhone, message: message }
    } else {
      endpoint = ENDPOINTS.openwa.sendText
      body = { chatId: `${cleanPhone}@c.us`, text: message }
    }

    const data = await apiCall(endpoint, token, 'POST', body, true, target)
    const msgId = data.data?.Id ?? data.MessageId ?? data.messageId ?? data.id ?? 'ok'
    return { success: true, messageId: msgId }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

function resolveFullMediaUrl(url: string): string {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const baseUrl = process.env.APP_URL || process.env.NUXT_PUBLIC_SITE_URL || 'http://host.docker.internal:3000'
  return `${baseUrl.replace(/\/$/, '')}/${url.replace(/^\//, '')}`
}

export async function sendMedia(
  token: string,
  phone: string,
  mediaType: 'image' | 'video' | 'audio' | 'document',
  fileUrl: string,
  caption?: string
): Promise<SendResult> {
  const fullFileUrl = resolveFullMediaUrl(fileUrl)
  let cleanPhone = phone.replace(/[\+\s\-]/g, '')
  if (cleanPhone.startsWith('00')) cleanPhone = cleanPhone.substring(2)
  if (cleanPhone.length === 10 && cleanPhone.startsWith('3')) {
    cleanPhone = `39${cleanPhone}`
  }

  if (ENGINE === 'hybrid') {
    const startIdx = roundRobinIndex++ % ACTIVE_ENGINES.length
    const errors: string[] = []

    for (let i = 0; i < ACTIVE_ENGINES.length; i++) {
      const target = ACTIVE_ENGINES[(startIdx + i) % ACTIVE_ENGINES.length]
      try {
        await sendPresenceSingle(token, cleanPhone, 30, target)
        let endpoint = ''
        let body: Record<string, unknown> = {}

        if (target === 'wuzapi') {
          endpoint = `/chat/send/${mediaType}`
          body = { Phone: `${cleanPhone}@s.whatsapp.net`, Url: fullFileUrl, Caption: caption || '' }
        } else if (target === 'gowa') {
          endpoint = `/send/${mediaType}`
          body = { phone: cleanPhone, [mediaType]: fullFileUrl, caption: caption || '' }
        } else {
          endpoint = `/messages/send-${mediaType === 'document' ? 'file' : mediaType}`
          body = { chatId: `${cleanPhone}@c.us`, url: fullFileUrl, caption: caption || '' }
        }

        const data = await apiCall(endpoint, token, 'POST', body, true, target)
        const msgId = data.data?.Id ?? data.MessageId ?? data.results?.message_id ?? data.id ?? 'ok'
        return { success: true, messageId: `${msgId} [via ${target}]` }
      } catch (err: any) {
        errors.push(`[${target}]: ${err.message || err}`)
      }
    }
    return { success: false, error: `[Hybrid Media All Engines Failed]: ${errors.join(' | ')}` }
  }

  const target = ENGINE as any
  try {
    let endpoint = ''
    let body: Record<string, unknown> = {}

    if (target === 'wuzapi') {
      endpoint = `/chat/send/${mediaType}`
      body = { Phone: `${cleanPhone}@s.whatsapp.net`, Url: fullFileUrl, Caption: caption || '' }
    } else if (target === 'gowa') {
      endpoint = `/send/${mediaType}`
      body = { phone: cleanPhone, [mediaType]: fullFileUrl, caption: caption || '' }
    } else {
      endpoint = `/messages/send-${mediaType === 'document' ? 'file' : mediaType}`
      body = { chatId: `${cleanPhone}@c.us`, url: fullFileUrl, caption: caption || '' }
    }

    const data = await apiCall(endpoint, token, 'POST', body, true, target)
    const msgId = data.data?.Id ?? data.MessageId ?? data.results?.message_id ?? data.id ?? 'ok'
    return { success: true, messageId: msgId }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

export async function disconnectEngine(token: string): Promise<void> {
  if (ENGINE === 'hybrid') {
    await Promise.allSettled(
      ACTIVE_ENGINES.map(async target => {
        if (target === 'gowa') {
          await apiCall(`/devices/${token}`, token, 'DELETE', undefined, true, target)
        } else {
          await apiCall(ENDPOINTS[target].logout, token, 'POST', undefined, true, target)
        }
      })
    )
    return
  }

  if (ENGINE === 'gowa') {
    await apiCall(`/devices/${token}`, token, 'DELETE')
  } else {
    await apiCall(ENDPOINTS[ENGINE as any].logout, token, 'POST')
  }
}

export async function sendPresence(token: string, phone: string, messageLength: number): Promise<void> {
  if (ENGINE === 'hybrid') {
    const target = ACTIVE_ENGINES[roundRobinIndex % ACTIVE_ENGINES.length]
    return sendPresenceSingle(token, phone, messageLength, target)
  }
  return sendPresenceSingle(token, phone, messageLength, ENGINE as any)
}

export async function checkPhone(token: string, phone: string): Promise<boolean> {
  if (ENGINE === 'hybrid') {
    for (const target of ACTIVE_ENGINES) {
      const ok = await checkPhoneSingle(token, phone, target)
      if (ok) return true
    }
    return true
  }
  return checkPhoneSingle(token, phone, ENGINE as any)
}

export function renderTemplate(
  template: string,
  fields: Record<string, string | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return String(fields[key] ?? fields[key.toLowerCase()] ?? `{{${key}}}`)
  })
}
