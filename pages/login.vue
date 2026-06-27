<template>
  <div class="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden text-on-surface font-sans transition-colors duration-500">
    <!-- Theme Toggle -->
    <div class="absolute top-6 right-6 z-20">
      <button @click="toggleColorMode" class="p-3 bg-surface-container-highest/10 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full hover:bg-surface-container-highest/20 transition-all shadow-lg text-on-surface group">
        <Sun v-if="colorMode.value === 'dark'" class="w-5 h-5 text-on-surface-variant group-hover:text-on-surface transition-colors" />
        <Moon v-else class="w-5 h-5 text-on-surface-variant group-hover:text-on-surface transition-colors" />
      </button>
    </div>

    <!-- Background glowing orbs -->
    <div class="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000"></div>

    <div class="w-full max-w-md p-8 bg-surface-container-lowest/80 dark:bg-surface-container-lowest/40 backdrop-blur-glass-heavy border border-black/5 dark:border-white/10 rounded-3xl shadow-2xl relative z-10 m-4 animate-fade-in">
      <div class="text-center mb-10">
        <div class="w-16 h-16 bg-gradient-to-tr from-primary to-secondary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/20">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold tracking-tight text-on-surface">Bentornato</h1>
        <p class="text-on-surface-variant mt-2 text-sm font-medium">Accedi al tuo workspace WaForge</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-5">
        <div>
          <label class="block text-sm font-medium mb-2 text-on-surface-variant">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required
            class="w-full px-4 py-3 bg-surface-container-low/50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder-on-surface-variant/50 transition-all"
            placeholder="tu@agenzia.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2 text-on-surface-variant">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required
            class="w-full px-4 py-3 bg-surface-container-low/50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder-on-surface-variant/50 transition-all"
            placeholder="••••••••"
          />
        </div>

        <transition name="fade">
          <div v-if="error" class="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm text-center flex items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {{ error }}
          </div>
        </transition>

        <button 
          type="submit" 
          :disabled="loading"
          class="w-full py-3.5 px-4 bg-primary hover:bg-primary-container text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(37,211,102,0.2)] hover:shadow-[0_0_25px_rgba(37,211,102,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="loading">Accesso in corso...</span>
          <span v-else>Accedi</span>
        </button>
        <div v-if="config.public.oauthEnabled" class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-black/10 dark:border-white/10"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-surface-container-lowest/80 dark:bg-[#1a1b1e] text-on-surface-variant">Oppure</span>
            </div>
          </div>
          <div class="mt-6">
            <a href="/api/auth/oauth/login" class="w-full flex justify-center py-3 px-4 border border-black/10 dark:border-white/10 rounded-xl shadow-sm bg-surface-container hover:bg-black/5 dark:hover:bg-white/5 text-sm font-medium text-on-surface transition-colors">
              <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12 6C8.69 6 6 8.69 6 12C6 15.31 8.69 18 12 18C15.31 18 18 15.31 18 12C18 8.69 15.31 6 12 6ZM12 16.5C9.52 16.5 7.5 14.48 7.5 12C7.5 9.52 9.52 7.5 12 7.5C14.48 7.5 16.5 9.52 16.5 12C16.5 14.48 14.48 16.5 12 16.5Z" fill="currentColor"/>
              </svg>
              Accedi con SSO / PocketID
            </a>
          </div>
        </div>
      </form>

      <div class="mt-8 text-center text-sm text-on-surface-variant font-medium">
        Non hai un account? 
        <NuxtLink to="/register" class="text-primary hover:text-primary-container hover:underline ml-1 transition-colors">Registrati</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useColorMode } from '#imports'
import { Sun, Moon } from 'lucide-vue-next'
import { z } from 'zod'

definePageMeta({
  layout: false
})

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const router = useRouter()
const authStore = useAuthStore()
const colorMode = useColorMode()
const config = useRuntimeConfig()

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// Zod Schema for client-side validation
const loginSchema = z.object({
  email: z.string().email('Indirizzo email non valido'),
  password: z.string().min(1, 'La password è obbligatoria')
})

const handleLogin = async () => {
  error.value = ''
  
  // Client-side Validation (Zod)
  try {
    loginSchema.parse({ email: email.value, password: password.value })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      error.value = err.errors[0].message
      return
    }
  }

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

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
