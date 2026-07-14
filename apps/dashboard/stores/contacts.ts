/**
 * Contacts Store
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface Contact {
  id: string
  name: string
  prefix: string
  phone: string
  fullPhone: string
  email?: string | null
  company?: string | null
  notes?: string | null
  isActive: boolean
  createdAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export const useContactsStore = defineStore('contacts', () => {
  const contacts = ref<Contact[]>([])
  const pagination = ref<Pagination>({ page: 1, limit: 50, total: 0, totalPages: 0 })
  const search = ref('')
  const selectedGroupId = ref<string | undefined>(undefined)
  const loading = ref(false)
  const selected = ref<Set<string>>(new Set())

  const hasSelection = computed(() => selected.value.size > 0)

  async function fetchContacts(page = 1) {
    loading.value = true
    try {
      const res = await $fetch<{ data: Contact[]; pagination: Pagination }>('/api/contacts', {
        query: { page, limit: pagination.value.limit, search: search.value || undefined, groupId: selectedGroupId.value || undefined },
      })
      contacts.value = res.data
      pagination.value = res.pagination
    } finally { loading.value = false }
  }

  async function createContact(data: Record<string, unknown>) {
    const res = await $fetch<{ data: Contact }>('/api/contacts', { method: 'POST', body: data })
    await fetchContacts(pagination.value.page)
    return res.data
  }

  async function importCSV(csv: string, groupId?: string) {
    const res = await $fetch<{ data: any }>('/api/contacts/import', { method: 'POST', body: { csv, groupId } })
    await fetchContacts(1)
    return res.data
  }

  async function deleteContacts(ids: string[]) {
    await $fetch('/api/contacts/bulk-delete', { method: 'POST', body: { ids } })
    selected.value = new Set()
    await fetchContacts(pagination.value.page)
  }

  function toggleSelect(id: string) {
    const newSet = new Set(selected.value)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    selected.value = newSet
  }

  function selectAll() {
    const newSet = new Set(selected.value)
    contacts.value.forEach(c => newSet.add(c.id))
    selected.value = newSet
  }

  function clearSelection() {
    selected.value = new Set()
  }

  async function bulkUpdateGroups(contactIds: string[], groupId: string, action: 'add' | 'remove') {
    await $fetch('/api/contacts/bulk-group', {
      method: 'POST',
      body: { contactIds, groupId, action }
    })
    await fetchContacts(pagination.value.page)
  }

  return { contacts, pagination, search, selectedGroupId, loading, selected, hasSelection, fetchContacts, createContact, importCSV, deleteContacts, toggleSelect, selectAll, clearSelection, bulkUpdateGroups }
})
