/**
 * CRM Store — Pipeline stages, kanban data, analytics
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PipelineStage {
  id: string
  name: string
  color: string
  position: number
  contacts: CrmContactCard[]
  _count: { contacts: number }
}

export interface CrmContactCard {
  id: string
  name: string
  company?: string | null
  email?: string | null
  phone: string
  labels?: string | null
  pipelineStageId?: string | null
  updatedAt: string
}

export interface ContactNote {
  id: string
  contactId: string
  authorId?: string | null
  type: string // note, call, email, meeting, stage_change, system
  content: string
  metadata?: any
  createdAt: string
}

export interface CrmAnalytics {
  totalContacts: number
  recentContacts: number
  unassigned: number
  byStage: { id: string; name: string; color: string; count: number }[]
  bySource: { source: string; count: number }[]
}

export const useCrmStore = defineStore('crm', () => {
  // Pipeline data
  const stages = ref<PipelineStage[]>([])
  const unassigned = ref<{ id: string; name: string; color: string; contacts: CrmContactCard[]; _count: { contacts: number } }>({
    id: '__unassigned', name: 'Inbox', color: '#94a3b8', contacts: [], _count: { contacts: 0 }
  })
  const loading = ref(false)

  // Analytics
  const analytics = ref<CrmAnalytics | null>(null)
  const analyticsLoading = ref(false)

  // Contact detail
  const activeContact = ref<any>(null)
  const activeContactNotes = ref<ContactNote[]>([])

  // ── Pipeline Kanban ─────────────────────────────────────────────────────

  async function fetchPipeline() {
    loading.value = true
    try {
      const res = await $fetch<{ data: { stages: PipelineStage[]; unassigned: typeof unassigned.value } }>('/api/crm/pipeline')
      stages.value = res.data.stages
      unassigned.value = res.data.unassigned
    } finally {
      loading.value = false
    }
  }

  async function moveContact(contactId: string, stageId: string | null) {
    await $fetch(`/api/crm/contacts/${contactId}/stage`, {
      method: 'PATCH',
      body: { stageId }
    })
    // Refresh pipeline data
    await fetchPipeline()
  }

  // ── Pipeline Stages CRUD ────────────────────────────────────────────────

  async function createStage(name: string, color?: string) {
    const maxPosition = stages.value.reduce((max, s) => Math.max(max, s.position), -1)
    await $fetch('/api/crm/pipeline-stages', {
      method: 'POST',
      body: { name, color, position: maxPosition + 1 }
    })
    await fetchPipeline()
  }

  async function updateStage(id: string, data: { name?: string; color?: string; position?: number }) {
    await $fetch(`/api/crm/pipeline-stages/${id}`, {
      method: 'PATCH',
      body: data
    })
    await fetchPipeline()
  }

  async function deleteStage(id: string) {
    await $fetch(`/api/crm/pipeline-stages/${id}`, { method: 'DELETE' })
    await fetchPipeline()
  }

  // ── Contact Detail ──────────────────────────────────────────────────────

  async function fetchContactDetail(id: string) {
    const res = await $fetch<{ data: any }>(`/api/crm/contacts/${id}`)
    activeContact.value = res.data
    return res.data
  }

  async function fetchContactNotes(id: string) {
    const res = await $fetch<{ data: ContactNote[] }>(`/api/crm/contacts/${id}/notes`)
    activeContactNotes.value = res.data
    return res.data
  }

  async function addNote(contactId: string, content: string, type: string = 'note') {
    await $fetch(`/api/crm/contacts/${contactId}/notes`, {
      method: 'POST',
      body: { content, type }
    })
    await fetchContactNotes(contactId)
  }

  // ── Analytics ───────────────────────────────────────────────────────────

  async function fetchAnalytics() {
    analyticsLoading.value = true
    try {
      const res = await $fetch<{ data: CrmAnalytics }>('/api/crm/analytics')
      analytics.value = res.data
    } finally {
      analyticsLoading.value = false
    }
  }

  // ── Computed ────────────────────────────────────────────────────────────

  const totalInPipeline = computed(() =>
    stages.value.reduce((sum, s) => sum + s._count.contacts, 0) + unassigned.value._count.contacts
  )

  return {
    stages, unassigned, loading,
    analytics, analyticsLoading,
    activeContact, activeContactNotes,
    totalInPipeline,
    fetchPipeline, moveContact,
    createStage, updateStage, deleteStage,
    fetchContactDetail, fetchContactNotes, addNote,
    fetchAnalytics,
  }
})
