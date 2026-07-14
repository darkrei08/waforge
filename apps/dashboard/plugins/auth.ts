import { useAuthStore } from '~/stores/auth'
import { defineNuxtPlugin, useRequestHeaders } from '#app'

export default defineNuxtPlugin(async (nuxtApp) => {
  const authStore = useAuthStore()
  
  // Solo se non abbiamo già l'utente in stato (evita re-fetch inutili)
  if (!authStore.user) {
    try {
      // Usiamo $fetch (non useFetch!) nei plugin per evitare
      // il doppio fetch SSR/Client che causa il refresh loop
      const headers = import.meta.server
        ? useRequestHeaders(['cookie'])
        : {}
      
      const response: any = await $fetch('/api/auth/me', {
        headers: headers as Record<string, string>
      })
      
      if (response && response.success) {
        authStore.user = response.user
      }
    } catch (e) {
      // Sessione non valida o errore di rete — utente non autenticato
      authStore.user = null
    }
  }
})
