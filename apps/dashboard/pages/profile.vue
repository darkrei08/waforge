<template>
  <div class="p-8 max-w-2xl space-y-6 animate-fade-in">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-on-surface tracking-tight">{{ t('profile.title') || 'Profilo Utente' }}</h1>
      <p class="text-on-surface-variant mt-1">Gestisci i tuoi dati personali e la sicurezza.</p>
    </div>

    <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
      <form @submit.prevent="updateProfile" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-on-surface-variant mb-1">Nome Completo</label>
          <input v-model="form.name" type="text"
                 class="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-on-surface focus:border-primary outline-none transition-colors" />
        </div>

        <div>
          <label class="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
          <input :value="authStore.user?.email" type="email" disabled
                 class="w-full px-4 py-3 bg-black/10 border border-white/5 rounded-lg text-on-surface-variant cursor-not-allowed" />
          <p class="text-xs text-on-surface-variant/50 mt-1">L'indirizzo email non può essere modificato.</p>
        </div>

        <hr class="border-white/10 my-6" />

        <h3 class="text-lg font-semibold text-on-surface mb-4">Modifica Password</h3>

        <div>
          <label class="block text-sm font-medium text-on-surface-variant mb-1">Password Corrente</label>
          <input v-model="form.currentPassword" type="password"
                 class="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-on-surface focus:border-primary outline-none transition-colors" />
        </div>

        <div>
          <label class="block text-sm font-medium text-on-surface-variant mb-1">Nuova Password</label>
          <input v-model="form.newPassword" type="password"
                 class="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-on-surface focus:border-primary outline-none transition-colors" />
        </div>

        <div v-if="error" class="p-4 bg-error/10 border border-error/20 text-error rounded-lg text-sm">
          {{ error }}
        </div>

        <div class="pt-4 flex justify-end">
          <button type="submit" :disabled="loading"
                  class="px-6 py-3 bg-primary hover:bg-primary-fixed-dim text-surface font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all flex items-center gap-2 disabled:opacity-50">
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            Salva Modifiche
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import { Save, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { useI18n } from '#i18n'

const { t } = useI18n()
const authStore = useAuthStore()
const addToast = inject('addToast') as Function

const form = ref({
  name: '',
  currentPassword: '',
  newPassword: ''
})

const loading = ref(false)
const error = ref('')

onMounted(() => {
  if (authStore.user) {
    form.value.name = authStore.user.name
  }
})

async function updateProfile() {
  error.value = ''
  
  if (form.value.newPassword && !form.value.currentPassword) {
    error.value = 'Devi inserire la password corrente per impostarne una nuova'
    return
  }

  loading.value = true
  try {
    const res = await $fetch<{ user: any }>('/api/auth/profile', {
      method: 'PUT',
      body: form.value
    })
    
    // Update local state if needed (e.g. name changed)
    if (authStore.user && res.user.name) {
      authStore.user.name = res.user.name
    }
    
    addToast('Profilo aggiornato con successo', 'success')
    
    // Reset password fields
    form.value.currentPassword = ''
    form.value.newPassword = ''
  } catch (e: any) {
    error.value = e.data?.message || 'Errore durante l\'aggiornamento'
  } finally {
    loading.value = false
  }
}
</script>
