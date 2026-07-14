import { $fetch } from 'ofetch'

export interface OfficialWhatsAppPayload {
  to: string
  type: 'template' | 'text'
  text?: { body: string }
  template?: {
    name: string
    language: { code: string }
    components?: any[]
  }
}

/**
 * Servizio per l'invio messaggi tramite le API Ufficiali WhatsApp Cloud.
 * Questo engine viene utilizzato SOLO per i tenant/agenzie con abbonamento Premium,
 * garantendo zero rischi di ban e massimi volumi.
 * 
 * L'abbonamento base continua ad usare Baileys/WuzAPI (whatsapp-engine.ts).
 */
export class OfficialWhatsAppEngine {
  private apiUrl: string
  private accessToken: string
  private phoneNumberId: string

  constructor(phoneNumberId: string, accessToken: string) {
    this.phoneNumberId = phoneNumberId
    this.accessToken = accessToken
    // La versione API potrebbe essere configurata via env, usiamo v19.0 di default
    this.apiUrl = `https://graph.facebook.com/v19.0/${this.phoneNumberId}/messages`
  }

  /**
   * Invia un messaggio tramite API Ufficiali
   */
  async sendMessage(payload: OfficialWhatsAppPayload) {
    try {
      const response = await $fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: {
          messaging_product: 'whatsapp',
          ...payload
        }
      })
      
      return response
    } catch (error) {
      console.error('[OfficialWhatsAppEngine] Errore invio:', error)
      throw error
    }
  }
}
