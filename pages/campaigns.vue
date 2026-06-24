<template>
  <div class="p-8 space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-on-surface tracking-tight">{{ t('nav.campaigns') }}</h1>
      <button @click="showWizard = true"
              class="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)] transition-all flex items-center gap-2">
        <Plus class="w-5 h-5" /> Nuova Campagna
      </button>
    </div>

    <!-- Active Campaign Progress -->
    <div v-if="store.activeProgress" class="bg-surface-container/40 backdrop-blur-xl border border-primary/30 rounded-2xl p-6 relative overflow-hidden">
      <div class="absolute -top-16 -right-16 w-48 h-48 bg-primary/15 rounded-full blur-[80px] pointer-events-none"></div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-semibold text-on-surface">Campagna in corso</h3>
          <p class="text-sm text-on-surface-variant">{{ store.activeProgress.sentCount + store.activeProgress.failedCount }} / {{ store.activeProgress.totalCount }}</p>
        </div>
        <span class="text-2xl font-bold text-primary">{{ store.activeProgress.progress }}%</span>
      </div>
      <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div class="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all duration-500"
             :style="{ width: store.activeProgress.progress + '%' }"></div>
      </div>
    </div>

    <!-- Campaigns List -->
    <div class="grid gap-4">
      <div v-if="store.loading" v-for="i in 3" :key="i" class="bg-surface-container/40 border border-white/10 rounded-2xl p-6">
        <div class="h-5 bg-white/5 rounded w-1/3 animate-pulse mb-3"></div>
        <div class="h-4 bg-white/5 rounded w-1/4 animate-pulse"></div>
      </div>

      <div v-else v-for="campaign in store.campaigns" :key="campaign.id"
           class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-semibold text-on-surface text-lg">{{ campaign.name }}</h3>
            <p class="text-sm text-on-surface-variant mt-1">Template: {{ campaign.template?.name || '—' }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="px-3 py-1 text-xs font-bold rounded-full" :class="statusClass(campaign.status)">
              {{ campaign.status }}
            </span>
            <button v-if="campaign.status === 'DRAFT'" @click="store.startCampaign(campaign.id)"
                    class="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
              <Play class="w-4 h-4" />
            </button>
            <button v-if="campaign.status === 'RUNNING'" @click="store.pauseCampaign(campaign.id)"
                    class="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition-colors">
              <Pause class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div class="flex gap-6 mt-4 text-sm text-on-surface-variant">
          <span>📤 {{ campaign.sentCount }} inviati</span>
          <span>❌ {{ campaign.failedCount }} falliti</span>
          <span>⏱️ {{ campaign.delayMin }}–{{ campaign.delayMax }}s delay</span>
        </div>
      </div>
    </div>

    <!-- Create Campaign Wizard -->
    <Teleport to="body">
      <div v-if="showWizard" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showWizard = false">
        <div class="w-full max-w-xl bg-surface-container-high border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-in">
          <h3 class="text-lg font-bold text-on-surface mb-6">Crea Nuova Campagna</h3>

          <!-- Step indicators -->
          <div class="flex gap-2 mb-6">
            <div v-for="s in 3" :key="s" class="flex-1 h-1 rounded-full transition-colors"
                 :class="wizardStep >= s ? 'bg-primary' : 'bg-white/10'"></div>
          </div>

          <!-- Step 1: Name -->
          <div v-if="wizardStep === 1" class="space-y-4">
            <label class="block text-sm font-medium text-on-surface-variant">Nome Campagna</label>
            <input v-model="newCampaign.name" type="text" placeholder="Es: Promo Estate 2026"
                   class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
          </div>

          <!-- Step 2: Template -->
          <div v-if="wizardStep === 2" class="space-y-4">
            <label class="block text-sm font-medium text-on-surface-variant">Template Messaggio</label>
            <select v-model="newCampaign.templateId"
                    class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none">
              <option value="" disabled>Seleziona template...</option>
              <option v-for="tmpl in templates" :key="tmpl.id" :value="tmpl.id">{{ tmpl.name }}</option>
            </select>
            
            <div v-if="selectedTemplatePreview" class="mt-4 p-4 bg-black/20 border border-white/5 rounded-xl">
              <span class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mb-2 block">Anteprima Messaggio</span>
              <div class="text-sm text-on-surface whitespace-pre-wrap leading-relaxed" v-html="selectedTemplatePreview"></div>
            </div>
          </div>

          <!-- Step 3: Rate Limit -->
          <div v-if="wizardStep === 3" class="space-y-4">
            <label class="block text-sm font-medium text-on-surface-variant">Ritardo tra messaggi (secondi)</label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-on-surface-variant">Min</label>
                <input v-model.number="newCampaign.delayMin" type="number" min="5" max="300"
                       class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
              </div>
              <div>
                <label class="text-xs text-on-surface-variant">Max</label>
                <input v-model.number="newCampaign.delayMax" type="number" min="10" max="600"
                       class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
              </div>
            </div>
            <p class="text-xs text-on-surface-variant">Contatti: TUTTI</p>
          </div>

          <div class="flex justify-between mt-6">
            <button @click="wizardStep > 1 ? wizardStep-- : showWizard = false"
                    class="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              {{ wizardStep > 1 ? '← Indietro' : 'Annulla' }}
            </button>
            <button v-if="wizardStep < 3" @click="wizardStep++"
                    :disabled="wizardStep === 1 && !newCampaign.name || wizardStep === 2 && !newCampaign.templateId"
                    class="px-5 py-2 bg-primary text-on-primary font-semibold rounded-lg transition-all disabled:opacity-30">
              Avanti →
            </button>
            <button v-else @click="handleCreate"
                    class="px-5 py-2 bg-primary text-on-primary font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all">
              Crea Campagna
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Plus, Play, Pause } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useCampaignsStore } from '~/stores/campaigns'

const { t } = useI18n()
const store = useCampaignsStore()

const showWizard = ref(false)
const wizardStep = ref(1)
const templates = ref<any[]>([])
const newCampaign = ref({ name: '', templateId: '', delayMin: 15, delayMax: 45 })

function formatWhatsAppText(text: string) {
  if (!text) return ''
  return text
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~(.*?)~/g, '<del>$1</del>')
}

const selectedTemplatePreview = computed(() => {
  const tmpl = templates.value.find(t => t.id === newCampaign.value.templateId)
  return tmpl ? formatWhatsAppText(tmpl.body) : ''
})

function statusClass(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'bg-white/10 text-on-surface-variant',
    RUNNING: 'bg-primary/20 text-primary animate-glow-pulse',
    PAUSED: 'bg-yellow-500/20 text-yellow-400',
    COMPLETED: 'bg-tertiary/20 text-tertiary',
    FAILED: 'bg-error/20 text-error',
  }
  return map[status] || map.DRAFT
}

async function handleCreate() {
  await store.createCampaign(newCampaign.value)
  showWizard.value = false
  wizardStep.value = 1
  newCampaign.value = { name: '', templateId: '', delayMin: 15, delayMax: 45 }
}

onMounted(async () => {
  store.fetchCampaigns()
  try {
    const res = await $fetch<{ data: any[] }>('/api/templates')
    templates.value = res.data
  } catch { /* silent */ }
})
</script>
