import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface Template {
  id: string
  name: string
  body: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

export const useTemplatesStore = defineStore('templates', () => {
  const templates = ref<Template[]>([])
  const loading = ref(false)

  async function fetchTemplates() {
    loading.value = true
    try {
      const res = await $fetch<{ data: Template[] }>('/api/templates')
      templates.value = res.data
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function createTemplate(data: { name: string; body: string; description?: string }) {
    await $fetch('/api/templates', { method: 'POST', body: data })
    await fetchTemplates()
  }

  async function updateTemplate(id: string, data: { name: string; body: string; description?: string }) {
    await $fetch(`/api/templates/${id}`, { method: 'PUT', body: data })
    await fetchTemplates()
  }

  async function deleteTemplate(id: string) {
    await $fetch(`/api/templates/${id}`, { method: 'DELETE' })
    await fetchTemplates()
  }

  return { templates, loading, fetchTemplates, createTemplate, updateTemplate, deleteTemplate }
})
