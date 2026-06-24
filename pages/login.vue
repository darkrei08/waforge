<template>
  <div class="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden text-white font-sans">
    <!-- Background glowing orbs -->
    <div class="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

    <div class="w-full max-w-md p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl relative z-10 m-4">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold tracking-tight">Bentornato</h1>
        <p class="text-gray-400 mt-2 text-sm">Accedi al tuo workspace WA Sender Pro</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-sm font-medium mb-2 text-gray-300">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required
            class="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-gray-600 transition-all"
            placeholder="tu@agenzia.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2 text-gray-300">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required
            class="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-gray-600 transition-all"
            placeholder="••••••••"
          />
        </div>

        <div v-if="error" class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
          {{ error }}
        </div>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="loading">Accesso in corso...</span>
          <span v-else>Accedi</span>
        </button>
      </form>

      <div class="mt-8 text-center text-sm text-gray-400">
        Non hai un account? 
        <NuxtLink to="/register" class="text-emerald-400 hover:text-emerald-300 hover:underline font-medium ml-1 transition-colors">Registrati</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from '#app'
import { useAuthStore } from '~/stores/auth'

definePageMeta({
  layout: false
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const { data, error: fetchError } = await useFetch('/api/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value }
    })

    if (fetchError.value) {
      error.value = fetchError.value.data?.message || 'Errore di connessione'
      loading.value = false
      return
    }

    const response = data.value as any
    if (response && response.success) {
      await authStore.fetchUser()
      router.push('/')
    } else {
      error.value = response?.message || 'Credenziali non valide'
    }
  } catch (e: any) {
    error.value = 'Errore imprevisto. Riprova.'
  } finally {
    loading.value = false
  }
}
</script>
