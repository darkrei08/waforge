/**
 * WhatsApp Connection Store (Multi-Device)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface WASession {
  id: string
  status: string
  phone: string | null
  name?: string | null
  description?: string | null
  tags?: string | null
  teamName?: string
  engine: string
  connected: boolean
  loggedIn: boolean
  updatedAt: string
}

export const useWhatsappStore = defineStore('whatsapp', () => {
  const sessions = ref<WASession[]>([])
  const loading = ref(false)
  const fetched = ref(false)

  // Derived from the first connected session (or first session overall)
  const connected = computed(() => sessions.value.some(s => s.connected))
  const engine = computed(() => sessions.value[0]?.engine ?? 'Hybrid (WuzAPI + GoWA + OpenWA)')
  const phone = computed(() => sessions.value.find(s => s.connected)?.phone ?? null)
  const statusLabel = computed(() => connected.value ? 'Connesso' : 'Disconnesso')

  async function fetchSessions() {
    loading.value = true
    try {
      const res = await $fetch<{ data: WASession[] }>('/api/whatsapp/sessions')
      sessions.value = res.data || []
    } catch { /* silent */ }
    finally { 
      loading.value = false
      fetched.value = true
    }
  }

  /** Alias for fetchSessions — used by api-status page */
  async function fetchStatus() {
    return fetchSessions()
  }

  async function disconnect(tokenId: string) {
    await $fetch('/api/whatsapp/disconnect', { 
      method: 'POST',
      body: { tokenId }
    })
    await fetchSessions()
  }

  async function updateSession(id: string, payload: { name?: string, tags?: string, description?: string }) {
    await $fetch(`/api/whatsapp/${id}`, {
      method: 'PATCH',
      body: payload
    })
    await fetchSessions()
  }

  return { sessions, connected, loading, fetched, engine, phone, statusLabel, fetchSessions, fetchStatus, disconnect, updateSession }
})
