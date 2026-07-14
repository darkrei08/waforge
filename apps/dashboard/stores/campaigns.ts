/**
 * Campaigns Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Campaign {
  id: string
  name: string
  status: string
  templateId: string
  template?: { name: string }
  totalCount: number
  sentCount: number
  failedCount: number
  delayMin: number
  delayMax: number
  scheduledAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  createdAt: string
}

interface CampaignProgress {
  id: string
  status: string
  totalCount: number
  sentCount: number
  failedCount: number
  progress: number
  isActive: boolean
}

export const useCampaignsStore = defineStore('campaigns', () => {
  const campaigns = ref<Campaign[]>([])
  const loading = ref(false)
  const activeProgress = ref<CampaignProgress | null>(null)
  let pollInterval: ReturnType<typeof setInterval> | null = null

  // Selection State
  const selected = ref(new Set<string>())
  const hasSelection = computed(() => selected.value.size > 0)

  const activeCampaign = computed(() => campaigns.value.find(c => c.status === 'RUNNING'))

  async function fetchCampaigns() {
    loading.value = true
    try {
      const res = await $fetch<{ data: Campaign[] }>('/api/campaigns', { query: { limit: 100 } })
      campaigns.value = res.data
    } finally { loading.value = false }
  }

  async function createCampaign(data: Record<string, unknown>) {
    const res = await $fetch<{ data: Campaign }>('/api/campaigns', { method: 'POST', body: data })
    await fetchCampaigns()
    return res.data
  }

  async function startCampaign(id: string) {
    await $fetch(`/api/campaigns/${id}/start`, { method: 'POST' })
    startPolling(id)
    await fetchCampaigns()
  }

  async function pauseCampaign(id: string) {
    await $fetch(`/api/campaigns/${id}/pause`, { method: 'POST' })
    stopPolling()
    await fetchCampaigns()
  }

  let eventSource: EventSource | null = null

  async function pollProgress(id: string) {
    try {
      const res = await $fetch<{ data: CampaignProgress }>(`/api/campaigns/${id}/status`)
      activeProgress.value = res.data
      if (!res.data.isActive && res.data.status !== 'RUNNING') {
        stopPolling()
        await fetchCampaigns()
      }
    } catch { /* silent */ }
  }

  function startPolling(id: string) {
    stopPolling()
    // Check initial status
    pollProgress(id)
    
    // Connect to SSE stream
    eventSource = new EventSource(`/api/campaigns/${id}/stream`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        activeProgress.value = data
        
        // Find campaign and update its local state partially for immediate UI feedback
        const c = campaigns.value.find(camp => camp.id === id)
        if (c) {
          c.status = data.status
          c.sentCount = data.sentCount
          c.failedCount = data.failedCount
        }
      } catch (e) {
        console.error('Failed to parse SSE message', e)
      }
    }
    
    eventSource.addEventListener('close', () => {
      stopPolling()
      fetchCampaigns()
    })
    
    eventSource.onerror = () => {
      // Fallback to traditional polling if SSE fails
      console.warn('SSE connection failed, falling back to polling')
      stopPolling()
      pollInterval = setInterval(() => pollProgress(id), 3000)
    }
  }

  function stopPolling() {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
    if (eventSource) { eventSource.close(); eventSource = null }
    activeProgress.value = null
  }

  async function updateCampaign(id: string, data: Record<string, unknown>) {
    const res = await $fetch<{ data: Campaign }>(`/api/campaigns/${id}`, { method: 'PATCH', body: data })
    await fetchCampaigns()
    return res.data
  }

  async function deleteCampaign(id: string) {
    await $fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    await fetchCampaigns()
  }

  async function deleteCampaigns(ids: string[]) {
    await $fetch('/api/campaigns/bulk-delete', { method: 'POST', body: { ids } })
    selected.value = new Set()
    await fetchCampaigns()
  }

  function toggleSelect(id: string) {
    const newSet = new Set(selected.value)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    selected.value = newSet
  }

  function selectAll() {
    const newSet = new Set(selected.value)
    campaigns.value.forEach(c => newSet.add(c.id))
    selected.value = newSet
  }

  function clearSelection() {
    selected.value = new Set()
  }

  return { 
    campaigns, loading, activeProgress, activeCampaign, selected, hasSelection,
    fetchCampaigns, createCampaign, updateCampaign, deleteCampaign, deleteCampaigns,
    startCampaign, pauseCampaign, startPolling, stopPolling,
    toggleSelect, selectAll, clearSelection
  }
})
