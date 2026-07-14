<template>
  <div class="min-h-screen bg-surface flex items-center justify-center relative overflow-hidden text-on-surface font-sans transition-colors duration-500 py-12">
    <!-- Theme Toggle -->
    <div class="absolute top-6 right-6 z-20">
      <button @click="toggleColorMode" class="p-3 bg-surface-container-highest/10 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full hover:bg-surface-container-highest/20 transition-all shadow-lg text-on-surface group">
        <Sun v-if="colorMode.value === 'dark'" class="w-5 h-5 text-on-surface-variant group-hover:text-on-surface transition-colors" />
        <Moon v-else class="w-5 h-5 text-on-surface-variant group-hover:text-on-surface transition-colors" />
      </button>
    </div>

    <!-- Background glowing orbs -->
    <div class="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000"></div>
    <div class="absolute bottom-[-15%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000"></div>

    <div class="w-full max-w-md p-8 bg-surface-container-lowest/80 dark:bg-surface-container-lowest/40 backdrop-blur-glass-heavy border border-black/5 dark:border-white/10 rounded-3xl shadow-2xl relative z-10 m-4 animate-fade-in">
      <div class="text-center mb-10">
        <div class="w-16 h-16 bg-gradient-to-tr from-secondary to-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/20">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 class="text-3xl font-bold tracking-tight text-on-surface">Crea un account</h1>
        <p class="text-on-surface-variant mt-2 text-sm font-medium">Inizia a gestire le tue campagne su WhatsApp</p>
      </div>

      <form @submit.prevent="handleRegister" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1.5 text-on-surface-variant">Nome Completo</label>
          <input 
            v-model="name" 
            type="text" 
            required
            class="w-full px-4 py-3 bg-surface-container-low/50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder-on-surface-variant/50 transition-all"
            placeholder="Mario Rossi"
          />
        </div>

        <div v-if="!inviteToken">
          <label class="block text-sm font-medium mb-1.5 text-on-surface-variant">Nome Agenzia / Team</label>
          <input 
            v-model="teamName" 
            type="text" 
            class="w-full px-4 py-3 bg-surface-container-low/50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder-on-surface-variant/50 transition-all"
            placeholder="La mia fantastica agenzia"
          />
          <p class="text-xs text-on-surface-variant/70 mt-1 font-medium">Opzionale. Verrà creato un workspace dedicato.</p>
        </div>

        <div>
          <label class="block text-sm font-medium mb-1.5 text-on-surface-variant">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required
            class="w-full px-4 py-3 bg-surface-container-low/50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-xl focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 text-on-surface placeholder-on-surface-variant/50 transition-all"
            placeholder="tu@agenzia.com"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1.5 text-on-surface-variant">Password</label>
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
          class="w-full py-3.5 px-4 bg-primary hover:bg-primary-container text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(37,211,102,0.2)] hover:shadow-[0_0_25px_rgba(37,211,102,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-6"
        >
          <svg v-if="loading" class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span v-if="loading">Registrazione...</span>
          <span v-else>Crea Account</span>
        </button>
      </form>

      <div class="mt-8 text-center text-sm text-on-surface-variant font-medium">
        Hai già un account? 
        <NuxtLink to="/login" class="text-primary hover:text-primary-container hover:underline ml-1 transition-colors">Accedi</NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'
import { useColorMode } from '#imports'
import { Sun, Moon } from 'lucide-vue-next'
import { z } from 'zod'

definePageMeta({
  layout: false
})

const name = ref('')
const teamName = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const route = useRoute()
const authStore = useAuthStore()
const colorMode = useColorMode()

const inviteToken = ref((route.query.invite as string) || '')

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// Zod Schema for client-side validation
const registerSchema = z.object({
  name: z.string().min(2, 'Il nome deve avere almeno 2 caratteri'),
  teamName: z.string().optional(),
  email: z.string().email('Indirizzo email non valido'),
  password: z.string().min(6, 'La password deve contenere almeno 6 caratteri'),
  inviteToken: z.string().optional()
})

const handleRegister = async () => {
  error.value = ''
  
  // Client-side validation (Zod)
  try {
    registerSchema.parse({
      name: name.value,
      teamName: teamName.value,
      email: email.value,
      password: password.value,
      inviteToken: inviteToken.value || undefined
    })
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      error.value = err.errors[0].message
      return
    }
  }

  loading.value = true

  try {
    const response: any = await $fetch('/api/auth/register', {
      method: 'POST',
      body: { 
        name: name.value,
        teamName: inviteToken.value ? undefined : teamName.value,
        email: email.value, 
        password: password.value,
        inviteToken: inviteToken.value || undefined
      }
    })

    if (response && response.success) {
      await authStore.fetchUser()
      await navigateTo('/', { replace: true })
    } else {
      error.value = response?.message || 'Impossibile creare l\'account'
    }
  } catch (e: any) {
    error.value = e.data?.message || 'Errore imprevisto. Riprova.'
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
