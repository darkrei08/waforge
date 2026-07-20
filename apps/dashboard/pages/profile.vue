<template>
  <div class="p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-on-surface tracking-tight">{{ t('profile.title') || 'Profilo Utente' }}</h1>
      <p class="text-on-surface-variant mt-1">Gestisci i tuoi dati personali, le preferenze e la sicurezza.</p>
    </div>

    <!-- Tabs Header -->
    <div class="flex gap-2 border-b border-white/10 pb-4 mb-6 overflow-x-auto scrollbar-hide">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
              class="px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
              :class="activeTab === tab.id ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:bg-white/5'">
        {{ tab.label }}
      </button>
    </div>

    <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl">
      <!-- GENERALE -->
      <form v-if="activeTab === 'general'" @submit.prevent="updateProfile" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-on-surface-variant mb-1">Nome Completo</label>
          <input v-model="form.name" type="text" class="input-surface" />
        </div>

        <div>
          <label class="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
          <input :value="authStore.user?.email" type="email" disabled class="input-surface opacity-50 cursor-not-allowed" />
          <p class="text-xs text-on-surface-variant/50 mt-1">L'indirizzo email non può essere modificato.</p>
        </div>

        <div class="pt-4 flex justify-end">
          <button type="submit" :disabled="loading" class="btn-primary flex items-center gap-2">
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            Salva Modifiche
          </button>
        </div>
      </form>

      <!-- SICUREZZA -->
      <form v-if="activeTab === 'security'" @submit.prevent="updatePassword" class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-on-surface-variant mb-1">Password Corrente</label>
          <input v-model="passForm.currentPassword" type="password" class="input-surface" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-on-surface-variant mb-1">Nuova Password</label>
          <input v-model="passForm.newPassword" type="password" class="input-surface" required />
        </div>

        <div v-if="error" class="p-4 bg-error/10 border border-error/20 text-error rounded-lg text-sm">
          {{ error }}
        </div>

        <div class="pt-4 flex justify-end">
          <button type="submit" :disabled="loading" class="btn-primary flex items-center gap-2">
            <Loader2 v-if="loading" class="w-4 h-4 animate-spin" />
            <Save v-else class="w-4 h-4" />
            Aggiorna Password
          </button>
        </div>
      </form>

      <!-- PREFERENZE -->
      <div v-if="activeTab === 'preferences'" class="space-y-5">
        <h3 class="text-lg font-semibold text-on-surface mb-2">Notifiche Email</h3>
        <label class="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5">
          <div class="relative">
            <input type="checkbox" v-model="prefs.emailOnLead" class="sr-only peer" @change="savePreferences">
            <div class="w-10 h-6 bg-surface-variant rounded-full peer peer-checked:bg-primary transition-colors"></div>
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
          </div>
          <div>
            <div class="text-sm font-medium text-on-surface">Nuovi Lead CRM</div>
            <div class="text-xs text-on-surface-variant">Ricevi un'email quando un contatto entra nel CRM.</div>
          </div>
        </label>
        
        <label class="flex items-center gap-3 cursor-pointer p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/5">
          <div class="relative">
            <input type="checkbox" v-model="prefs.emailOnCampaignEnd" class="sr-only peer" @change="savePreferences">
            <div class="w-10 h-6 bg-surface-variant rounded-full peer peer-checked:bg-primary transition-colors"></div>
            <div class="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
          </div>
          <div>
            <div class="text-sm font-medium text-on-surface">Fine Campagne WA</div>
            <div class="text-xs text-on-surface-variant">Ricevi un riepilogo al termine di una campagna.</div>
          </div>
        </label>
      </div>

      <!-- API KEYS -->
      <div v-if="activeTab === 'api-keys'" class="space-y-5">
        <div class="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-4 mb-4">
          <p class="text-sm text-on-surface-variant max-w-sm">Gestisci i token per integrare servizi esterni (es. Zapier, n8n) con questo Workspace.</p>
          <button @click="showNewKeyModal = true" class="px-4 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap">
            <Plus class="w-4 h-4" /> Genera Token
          </button>
        </div>

        <div v-if="fetchingKeys" class="animate-pulse h-20 bg-white/5 rounded-xl"></div>
        
        <div v-else-if="apiKeys.length === 0" class="text-center p-8 border border-dashed border-white/10 rounded-2xl">
          <Key class="w-8 h-8 text-on-surface-variant mx-auto mb-2 opacity-50" />
          <p class="text-sm text-on-surface-variant">Nessuna API Key generata per questo Workspace.</p>
        </div>

        <div v-else class="space-y-3">
          <div v-for="key in apiKeys" :key="key.id" class="flex justify-between items-center p-4 bg-black/20 border border-white/5 rounded-xl group hover:border-white/10 transition-colors">
            <div>
              <p class="font-medium text-sm text-on-surface">{{ key.name }}</p>
              <p class="text-xs text-on-surface-variant font-mono mt-1 blur-sm group-hover:blur-none transition-all cursor-pointer" @click="copy(key.key)" title="Clicca per copiare">{{ key.key.substring(0, 12) }}••••••••••••••••</p>
            </div>
            <div class="flex items-center gap-4">
              <span class="text-xs text-on-surface-variant/50 hidden sm:block">Creata: {{ new Date(key.createdAt).toLocaleDateString() }}</span>
              <button @click="revokeKey(key.id)" class="p-2 text-error/70 hover:text-error hover:bg-error/10 rounded-lg transition-colors" title="Revoca">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Modal Nuova API Key -->
    <div v-if="showNewKeyModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div class="bg-surface-container border border-white/10 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
        <h3 class="text-lg font-bold mb-4">Nuova API Key</h3>
        <input v-model="newKeyName" placeholder="Es. Zapier Integrazione" class="input-surface mb-4 w-full" @keyup.enter="generateKey" autofocus />
        <div class="flex gap-3 justify-end">
          <button @click="showNewKeyModal = false" class="px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/5 transition-colors">Annulla</button>
          <button @click="generateKey" :disabled="!newKeyName" class="px-4 py-2 bg-primary text-surface rounded-lg text-sm font-medium hover:bg-primary-fixed-dim transition-colors disabled:opacity-50">Genera</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Save, Loader2, Key, Plus, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { useI18n } from '#i18n'

const authStore = useAuthStore()
const { t } = useI18n()

const tabs = [
  { id: 'general', label: 'Generale' },
  { id: 'security', label: 'Sicurezza' },
  { id: 'preferences', label: 'Preferenze' },
  { id: 'api-keys', label: 'API Keys' }
]
const activeTab = ref('general')

const loading = ref(false)
const error = ref('')

// Generale
const form = ref({ name: authStore.user?.name || '' })
const updateProfile = async () => { /* MVP implementation */ }

// Sicurezza
const passForm = ref({ currentPassword: '', newPassword: '' })
const updatePassword = async () => { /* MVP implementation */ }

// Preferenze
const prefs = ref({ emailOnLead: true, emailOnCampaignEnd: false })
const savePreferences = async () => {
  // TODO: api call to save preferences
}

// API Keys
const apiKeys = ref<any[]>([])
const fetchingKeys = ref(false)
const showNewKeyModal = ref(false)
const newKeyName = ref('')

const fetchKeys = async () => {
  fetchingKeys.value = true
  try {
    apiKeys.value = await $fetch('/api/team/keys', { headers: { Authorization: `Bearer ${authStore.token}` }})
  } catch (e) {
    console.error('Failed to fetch API keys', e)
  }
  fetchingKeys.value = false
}

const generateKey = async () => {
  if (!newKeyName.value) return
  try {
    const key = await $fetch('/api/team/keys', { 
      method: 'POST', 
      body: { name: newKeyName.value },
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    apiKeys.value.unshift(key)
    showNewKeyModal.value = false
    newKeyName.value = ''
    alert(`Token generato:\n\n${key.key}\n\nCopiato negli appunti! Conservalo in modo sicuro.`)
    navigator.clipboard.writeText(key.key)
  } catch (e) {
    alert("Errore nella generazione del token")
  }
}

const revokeKey = async (id: string) => {
  if (!confirm('Sei sicuro di voler revocare questo token? Tutte le integrazioni esterne che lo usano smetteranno di funzionare immediatamente.')) return
  try {
    await $fetch(`/api/team/keys/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${authStore.token}` } })
    apiKeys.value = apiKeys.value.filter(k => k.id !== id)
  } catch (e) {
    alert("Errore nella revoca del token")
  }
}

const copy = (text: string) => {
  navigator.clipboard.writeText(text)
}

onMounted(() => {
  fetchKeys()
})
</script>

<style scoped>
.input-surface {
  @apply w-full px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-on-surface focus:border-primary outline-none transition-colors;
}
.btn-primary {
  @apply px-6 py-3 bg-primary hover:bg-primary-fixed-dim text-surface font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all;
}
</style>
