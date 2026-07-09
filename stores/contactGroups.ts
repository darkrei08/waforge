import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface ContactGroup {
  id: string
  name: string
  color?: string | null
  _count?: { contacts: number }
}

export const useContactGroupsStore = defineStore('contactGroups', () => {
  const groups = ref<ContactGroup[]>([])
  const loading = ref(false)

  async function fetchGroups() {
    loading.value = true
    try {
      const res = await $fetch<{ data: ContactGroup[] }>('/api/contact-groups')
      groups.value = res.data
    } finally {
      loading.value = false
    }
  }

  async function createGroup(data: { name: string; color?: string }) {
    const res = await $fetch<{ data: ContactGroup }>('/api/contact-groups', {
      method: 'POST',
      body: data
    })
    await fetchGroups()
    return res.data
  }

  async function deleteGroup(id: string) {
    await $fetch(`/api/contact-groups/${id}`, { method: 'DELETE' })
    await fetchGroups()
  }

  return { groups, loading, fetchGroups, createGroup, deleteGroup }
})
