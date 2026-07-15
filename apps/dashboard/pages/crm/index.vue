<template>
  <div class="h-[calc(100vh-theme(spacing.16))] flex flex-col p-8 pb-0 animate-fade-in relative overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between shrink-0 mb-6">
      <div>
        <h1 class="text-3xl font-bold text-on-surface tracking-tight">Pipeline CRM</h1>
        <p class="text-on-surface-variant mt-1">
          Gestisci i tuoi contatti attraverso il funnel di vendita. 
          <span class="font-semibold text-primary ml-2">{{ store.totalInPipeline }} Contatti</span>
        </p>
      </div>
      <div class="flex gap-3">
        <button @click="showAddStageModal = true" class="btn-secondary">
          <Plus class="w-4 h-4 mr-2 inline" /> Nuova Fase
        </button>
        <NuxtLink :to="localePath('/contacts')" class="btn-primary">
          <Users class="w-4 h-4 mr-2 inline" /> Tutti i Contatti
        </NuxtLink>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="store.loading && store.stages.length === 0" class="flex-1 flex items-center justify-center">
      <Loader2 class="w-8 h-8 text-primary animate-spin" />
    </div>

    <!-- Kanban Board -->
    <div v-else class="flex-1 min-h-0 relative -mx-8 px-8 pb-8">
      <CrmKanban 
        :stages="store.stages" 
        :unassigned="store.unassigned" 
        @move="handleMove" 
        @contact-click="openContactDetail"
        @add-stage="showAddStageModal = true"
      />
    </div>

    <!-- Add Stage Modal (Simple) -->
    <div v-if="showAddStageModal" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-surface rounded-2xl w-full max-w-md shadow-2xl p-6">
        <h2 class="text-xl font-bold mb-4 text-on-surface">Nuova Fase Pipeline</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">Nome Fase</label>
            <input v-model="newStage.name" type="text" class="input-surface w-full" placeholder="es. Qualificato">
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">Colore (Hex)</label>
            <div class="flex gap-2">
              <input v-model="newStage.color" type="color" class="h-10 w-10 p-1 bg-surface-container rounded-lg border border-black/10">
              <input v-model="newStage.color" type="text" class="input-surface flex-1" placeholder="#6366f1">
            </div>
          </div>
        </div>
        <div class="flex justify-end gap-3 mt-6">
          <button @click="showAddStageModal = false" class="px-4 py-2 text-on-surface-variant hover:text-on-surface transition-colors">Annulla</button>
          <button @click="handleAddStage" :disabled="!newStage.name" class="btn-primary">Crea</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus, Users, Loader2 } from 'lucide-vue-next'
import { useCrmStore } from '~/stores/crm'
import { useAuthStore } from '~/stores/auth'
import { useLocalePath } from '#i18n'

const store = useCrmStore()
const authStore = useAuthStore()
const localePath = useLocalePath()

const showAddStageModal = ref(false)
const newStage = ref({ name: '', color: '#6366f1' })

onMounted(() => {
  if (authStore.currentTeam) {
    store.fetchPipeline()
  }
})

// Handle drop event from CrmKanban
async function handleMove(contactId: string, targetStageId: string | null) {
  // Optimistic UI update could be added here
  await store.moveContact(contactId, targetStageId)
}

function openContactDetail(contactId: string) {
  // For now, we'll navigate to the contacts page or a future detail page
  // A dedicated CRM drawer would be better
  console.log("Apri dettaglio CRM per:", contactId)
  alert("Dettaglio CRM in arrivo. Contatto ID: " + contactId)
}

async function handleAddStage() {
  if (!newStage.value.name) return
  await store.createStage(newStage.value.name, newStage.value.color)
  showAddStageModal.value = false
  newStage.value = { name: '', color: '#6366f1' }
}
</script>
