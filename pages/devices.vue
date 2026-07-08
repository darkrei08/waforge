<template>
  <div class="p-8 h-full flex flex-col">
    <!-- Blocker Message -->
    <div v-if="route.query.blocked" class="mb-6 p-4 bg-error/10 border border-error/20 rounded-xl flex items-center gap-3">
      <AlertCircle class="w-6 h-6 text-error flex-shrink-0" />
      <div>
        <h4 class="text-error font-semibold text-sm">Accesso bloccato</h4>
        <p class="text-error/80 text-sm">Devi connettere almeno un dispositivo WhatsApp per accedere a quella pagina.</p>
      </div>
    </div>

    <div class="flex items-center justify-between mb-8">
      <div>
        <h2 class="text-3xl font-bold text-on-surface">{{ t('nav.devices') }}</h2>
        <p class="text-on-surface-variant mt-1">Gestisci i dispositivi WhatsApp collegati al tuo team.</p>
      </div>
      <NuxtLink :to="localePath('/connect')" class="px-5 py-2.5 bg-primary hover:bg-primary-fixed-dim text-surface font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(37,211,102,0.3)]">
        <Smartphone class="w-5 h-5" />
        Connetti Dispositivo
      </NuxtLink>
    </div>

    <!-- Devices Grid -->
    <div v-if="waStore.loading" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-8 h-8 text-primary animate-spin" />
    </div>
    
    <div v-else-if="waStore.sessions.length === 0" class="flex-1 flex flex-col items-center justify-center p-12 bg-black/5 dark:bg-white/5 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
      <Smartphone class="w-16 h-16 text-on-surface-variant mb-4 opacity-50" />
      <h3 class="text-xl font-semibold mb-2">Nessun dispositivo</h3>
      <p class="text-on-surface-variant mb-6 text-center max-w-md">Non hai ancora collegato nessun dispositivo WhatsApp. Collegalo ora per sbloccare Rubrica, Campagne e Live Chat.</p>
      <NuxtLink :to="localePath('/connect')" class="px-5 py-2.5 bg-primary hover:bg-primary-fixed-dim text-surface font-semibold rounded-lg transition-colors flex items-center gap-2">
        <QrCode class="w-5 h-5" />
        Scansiona QR Code
      </NuxtLink>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="session in waStore.sessions" :key="session.id" 
           class="bg-surface-container/50 backdrop-blur-md border rounded-2xl p-6 shadow-lg relative group transition-colors"
           :class="session.connected ? 'border-primary/20' : 'border-error/20'">
        
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="p-2.5 rounded-xl flex items-center justify-center" :class="session.connected ? 'bg-primary/10 text-primary' : 'bg-error/10 text-error'">
              <Smartphone class="w-6 h-6" />
            </div>
            <div>
              <h4 class="font-bold text-on-surface">{{ session.name || session.phone ? (session.name ? session.name : '+' + session.phone) : 'In attesa...' }}</h4>
              <p v-if="session.name && session.phone" class="text-xs text-on-surface-variant font-medium">+{{ session.phone }}</p>
              <p class="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">{{ session.engine }}</p>
            </div>
          </div>
          
          <div class="flex flex-col items-end gap-2">
            <div class="w-3 h-3 rounded-full shadow-sm" :class="session.connected ? 'bg-primary shadow-primary/50' : 'bg-error shadow-error/50'"></div>
            <button @click="openEditModal(session)" class="p-1.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Modifica Dispositivo">
              <Pencil class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="session.tags" class="flex flex-wrap gap-1.5 mb-4">
          <span v-for="tag in session.tags.split(',')" :key="tag" class="px-2 py-0.5 text-[10px] font-bold bg-black/10 dark:bg-white/10 text-on-surface-variant rounded-md uppercase">
            {{ tag.trim() }}
          </span>
        </div>

        <div class="space-y-2 mb-6">
          <div class="flex justify-between text-sm">
            <span class="text-on-surface-variant">Stato:</span>
            <span class="font-semibold" :class="session.connected ? 'text-primary' : 'text-error'">
              {{ session.connected ? 'Connesso' : 'Disconnesso' }}
            </span>
          </div>
          <div v-if="session.teamName" class="flex justify-between text-sm">
            <span class="text-on-surface-variant">Team:</span>
            <span class="text-on-surface font-medium">{{ session.teamName }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-on-surface-variant">Ultimo sync:</span>
            <span class="text-on-surface">{{ new Date(session.updatedAt).toLocaleTimeString() }}</span>
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <button v-if="session.connected && session.phone" @click="sendTestMessage(session.id)" class="w-full py-2.5 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 rounded-xl font-medium transition-colors flex items-center justify-center gap-2" title="Invia un messaggio di test a questo numero">
            <Send class="w-4 h-4" />
            Test Messaggio
          </button>
          <button @click="disconnectSession(session.id)" class="w-full py-2.5 border border-error/30 text-error hover:bg-error/10 rounded-xl font-medium transition-colors flex items-center justify-center gap-2">
            <LogOut class="w-4 h-4" />
            Disconnetti
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Device Modal -->
    <div v-if="editModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="editModalOpen = false">
      <div class="bg-surface border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-xl font-bold text-on-surface">Modifica Dispositivo</h3>
          <button @click="editModalOpen = false" class="text-on-surface-variant hover:text-on-surface">
            <X class="w-6 h-6" />
          </button>
        </div>
        
        <form @submit.prevent="saveDevice" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">Nome Dispositivo</label>
            <input v-model="editForm.name" type="text" placeholder="es. iPhone Aziendale" class="w-full px-4 py-2.5 bg-surface-container border border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
          </div>

          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">Descrizione (opzionale)</label>
            <input v-model="editForm.description" type="text" placeholder="es. Telefono del supporto clienti" class="w-full px-4 py-2.5 bg-surface-container border border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">Tags (separati da virgola)</label>
            <input v-model="editForm.tags" type="text" placeholder="es. supporto, vendite" class="w-full px-4 py-2.5 bg-surface-container border border-white/10 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" />
            <p class="text-xs text-on-surface-variant mt-1">Usa la virgola per separare più tag.</p>
          </div>

          <div class="pt-4 flex gap-3">
            <button type="button" @click="editModalOpen = false" class="flex-1 py-2.5 px-4 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-xl font-semibold transition-colors">
              Annulla
            </button>
            <button type="submit" :disabled="saving" class="flex-1 py-2.5 px-4 bg-primary hover:bg-primary-fixed-dim text-surface rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
              <Loader2 v-if="saving" class="w-4 h-4 animate-spin" />
              Salva
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { useRoute } from 'vue-router'
import { Smartphone, LogOut, Loader2, QrCode, AlertCircle, Pencil, X, Send } from 'lucide-vue-next'
import { useI18n, useLocalePath } from '#i18n'
import { useWhatsappStore } from '~/stores/whatsapp'

const { t } = useI18n()
const localePath = useLocalePath()
const waStore = useWhatsappStore()
const route = useRoute()
const addToast = inject('addToast') as Function

const editModalOpen = ref(false)
const saving = ref(false)
const editForm = ref({ id: '', name: '', tags: '', description: '' })

const openEditModal = (session: any) => {
  editForm.value = {
    id: session.id,
    name: session.name || '',
    tags: session.tags || '',
    description: session.description || ''
  }
  editModalOpen.value = true
}

const saveDevice = async () => {
  saving.value = true
  try {
    await waStore.updateSession(editForm.value.id, {
      name: editForm.value.name,
      tags: editForm.value.tags,
      description: editForm.value.description
    })
    addToast('Dispositivo aggiornato', 'success')
    editModalOpen.value = false
  } catch (e) {
    addToast('Errore durante il salvataggio', 'error')
  } finally {
    saving.value = false
  }
}

const disconnectSession = async (tokenId: string) => {
  if (!confirm('Sei sicuro di voler disconnettere questo dispositivo?')) return
  try {
    await waStore.disconnect(tokenId)
    addToast('Dispositivo disconnesso', 'success')
  } catch (e) {
    addToast('Errore durante la disconnessione', 'error')
  }
}

const sendTestMessage = async (sessionId: string) => {
  try {
    addToast('Invio test in corso...', 'info')
    await $fetch('/api/whatsapp/test', {
      method: 'POST',
      body: { sessionId }
    })
    addToast('Messaggio di test inviato!', 'success')
  } catch (e: any) {
    addToast(e.data?.statusMessage || 'Errore durante l\'invio del test', 'error')
  }
}

onMounted(() => {
  waStore.fetchSessions()
})
</script>
