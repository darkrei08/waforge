import { prisma } from '../server/utils/prisma'
import { getPolicyForContact } from './whatsapp-policy'

export interface GowaClientConfig {
  accessToken: string;
  phoneNumberId: string;
}

export class GowaClient {
  private config: GowaClientConfig;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(config: GowaClientConfig) {
    this.config = config;
  }

  static async forTeam(teamId: string): Promise<GowaClient | null> {
    const session = await prisma.whatsAppSession.findFirst({
      where: { teamId, status: 'connected' }
    });
    if (!session || !session.token || !session.phone) return null;
    
    // In a real scenario, you'd separate the GOWA phoneNumberId from the actual phone number, 
    // but we can assume 'phone' here holds the Meta Phone Number ID for GOWA.
    return new GowaClient({
      accessToken: session.token,
      phoneNumberId: session.phone
    });
  }

  private async request(endpoint: string, method: string, body?: any) {
    const url = `${this.baseUrl}/${this.config.phoneNumberId}/${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('GOWA API Error:', data);
      throw new Error(data.error?.message || 'GOWA API Error');
    }
    return data;
  }

  /**
   * Send a simple text message.
   */
  async sendText(to: string, text: string) {
    // Basic policy check before sending
    await this.checkPolicy(to, 'transactional');

    return this.request('messages', 'POST', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: true, body: text }
    });
  }

  /**
   * Send a media message by its URL or ID
   */
  async sendMedia(to: string, mediaType: 'image' | 'document' | 'audio' | 'video', mediaVal: { link?: string; id?: string }, caption?: string) {
    await this.checkPolicy(to, 'transactional');

    const mediaPayload: any = { ...mediaVal };
    if (caption && (mediaType === 'image' || mediaType === 'document' || mediaType === 'video')) {
      mediaPayload.caption = caption;
    }

    return this.request('messages', 'POST', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: mediaType,
      [mediaType]: mediaPayload
    });
  }

  /**
   * Send a reaction to a specific message
   */
  async sendReaction(to: string, messageId: string, emoji: string) {
    return this.request('messages', 'POST', {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'reaction',
      reaction: {
        message_id: messageId,
        emoji
      }
    });
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string) {
    return this.request('messages', 'POST', {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    });
  }
  
  private async checkPolicy(phone: string, category: 'marketing' | 'transactional') {
    const policy = await getPolicyForContact(phone);
    if (!policy) return; // if no contact found, just send
    
    if (category === 'marketing' && !policy.optInMarketing) {
      throw new Error(`Contact ${phone} has opted out of marketing messages.`);
    }
    if (category === 'transactional' && !policy.optInTransactional) {
      throw new Error(`Contact ${phone} has opted out of all transactional messages.`);
    }
  }
}
