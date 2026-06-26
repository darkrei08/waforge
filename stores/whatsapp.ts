/**
 * WhatsApp Connection Store (Multi-Device)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface WASession {
  id: string
  status: string
  phone: string | null
  engine: string
  connected: boolean
  loggedIn: boolean
  updatedAt: string
}

export const useWhatsappStore = defineStore('whatsapp', () => {
  const sessions = ref<WASession[]>([])
  const loading = ref(false)

  const connected = computed(() => sessions.value.some(s => s.connected))

  async function fetchSessions() {
    try {
      const res = await $fetch<{ data: WASession[] }>('/api/whatsapp/sessions')
      sessions.value = res.data || []
    } catch { /* silent */ }
  }

  async function disconnect(tokenId: string) {
    await $fetch('/api/whatsapp/disconnect', { 
      method: 'POST',
      body: { tokenId }
    })
    await fetchSessions()
  }

  return { sessions, connected, loading, fetchSessions, disconnect }
})
