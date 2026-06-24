<template>
  <div class="min-h-screen bg-[#0a0a0a] flex items-center justify-center relative overflow-hidden text-white font-sans py-12">
    <!-- Background glowing orbs -->
    <div class="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
    <div class="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

    <div class="w-full max-w-md p-8 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl relative z-10 m-4">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold tracking-tight">Crea un account</h1>
        <p class="text-gray-400 mt-2 text-sm">Inizia a gestire le tue campagne su WhatsApp</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1.5 text-gray-300">Nome Completo</label>
          <input 
            v-model="name" 
            type="text" 
            required
            class="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-gray-600 transition-all"
            placeholder="Mario Rossi"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1.5 text-gray-300">Nome Agenzia / Team</label>
          <input 
            v-model="teamName" 
            type="text" 
            class="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-gray-600 transition-all"
            placeholder="La mia fantastica agenzia"
          />
          <p class="text-xs text-gray-500 mt-1">Opzionale. Verrà creato un workspace dedicato.</p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1.5 text-gray-300">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required
            class="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 text-white placeholder-gray-600 transition-all"
            placeholder="tu@agenzia.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1.5 text-gray-300">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required
            minlength="6"
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
          class="w-full py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="loading">Registrazione...</span>
          <span v-else>Crea Account</span>
        </button>
      </form>

      <div class="mt-8 text-center text-sm text-gray-400">
        Hai già un account? 
        <NuxtLink to="/login" class="text-emerald-400 hover:text-emerald-300 hover:underline font-medium ml-1 transition-colors">Accedi</NuxtLink>
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

const name = ref('')
const teamName = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const handleRegister = async () => {
  error.value = ''
  loading.value = true

  try {
    const { data, error: fetchError } = await useFetch('/api/auth/register', {
      method: 'POST',
      body: { 
        name: name.value,
        teamName: teamName.value,
        email: email.value, 
        password: password.value 
      }
    })

    if (fetchError.value) {
      error.value = fetchError.value.data?.message || 'Errore durante la registrazione'
      loading.value = false
      return
    }

    const response = data.value as any
    if (response && response.success) {
      await authStore.fetchUser()
      router.push('/')
    } else {
      error.value = response?.message || 'Impossibile creare l\'account'
    }
  } catch (e: any) {
    error.value = 'Errore imprevisto. Riprova.'
  } finally {
    loading.value = false
  }
}
</script>
