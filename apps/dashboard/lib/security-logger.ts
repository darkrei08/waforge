/**
 * Security Logger — NIST CSF 2.0 / OWASP A09 (Logging & Monitoring)
 *
 * Structured audit log for security events.
 * In production, ship to external SIEM (Datadog, Splunk, CloudWatch).
 */

export type SecurityEventType =
  | 'AUTH_FAILURE'
  | 'AUTH_SUCCESS'
  | 'RATE_LIMITED'
  | 'INJECTION_BLOCKED'
  | 'VALIDATION_ERROR'
  | 'CAMPAIGN_STARTED'
  | 'CAMPAIGN_COMPLETED'
  | 'CONTACT_IMPORTED'
  | 'WHATSAPP_CONNECTED'
  | 'WHATSAPP_DISCONNECTED'
  | 'CONFIG_CHANGED'

interface SecurityEvent {
  timestamp: string
  type: SecurityEventType
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
  ip?: string
  requestId?: string
  userId?: string
  details?: Record<string, unknown>
}

function emit(event: SecurityEvent) {
  const line = JSON.stringify({
    ...event,
    service: 'waforge',
    env: process.env.NODE_ENV,
  })

  if (event.severity === 'ERROR' || event.severity === 'CRITICAL') {
    console.error(`[SECURITY] ${line}`)
  } else if (event.severity === 'WARN') {
    console.warn(`[SECURITY] ${line}`)
  } else {
    console.log(`[SECURITY] ${line}`)
  }
}

export const securityLog = {
  authFailure: (ip: string, path: string, requestId?: string) =>
    emit({ timestamp: new Date().toISOString(), type: 'AUTH_FAILURE', severity: 'WARN', ip, requestId, details: { path } }),

  authSuccess: (ip: string, requestId?: string) =>
    emit({ timestamp: new Date().toISOString(), type: 'AUTH_SUCCESS', severity: 'INFO', ip, requestId }),

  rateLimited: (ip: string, requestId?: string) =>
    emit({ timestamp: new Date().toISOString(), type: 'RATE_LIMITED', severity: 'WARN', ip, requestId }),

  injectionBlocked: (ip: string, url: string, requestId?: string) =>
    emit({ timestamp: new Date().toISOString(), type: 'INJECTION_BLOCKED', severity: 'CRITICAL', ip, requestId, details: { url } }),

  validationError: (path: string, details: unknown, requestId?: string) =>
    emit({ timestamp: new Date().toISOString(), type: 'VALIDATION_ERROR', severity: 'INFO', requestId, details: { path, issues: details } }),

  campaignStarted: (campaignId: string, totalContacts: number) =>
    emit({ timestamp: new Date().toISOString(), type: 'CAMPAIGN_STARTED', severity: 'INFO', details: { campaignId, totalContacts } }),

  campaignCompleted: (campaignId: string, sent: number, failed: number) =>
    emit({ timestamp: new Date().toISOString(), type: 'CAMPAIGN_COMPLETED', severity: 'INFO', details: { campaignId, sent, failed } }),

  whatsappConnected: (phone?: string) =>
    emit({ timestamp: new Date().toISOString(), type: 'WHATSAPP_CONNECTED', severity: 'INFO', details: { phone } }),

  whatsappDisconnected: () =>
    emit({ timestamp: new Date().toISOString(), type: 'WHATSAPP_DISCONNECTED', severity: 'WARN' }),
}
