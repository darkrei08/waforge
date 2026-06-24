import { useAuthStore } from '~/stores/auth'
import { defineNuxtPlugin, useRequestHeaders, useFetch } from '#app'

export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  
  if (!authStore.user) {
    try {
      const headers = useRequestHeaders(['cookie']) as Record<string, string>
      const { data } = await useFetch('/api/auth/me', { headers })
      
      const response = data.value as any
      if (response && response.success) {
        authStore.user = response.user
      }
    } catch (e) {
      // Ignore fetch errors during initialization
    }
  }
})
