<template>
  <div class="p-8 space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-on-surface tracking-tight">{{ t('campaigns.title') }}</h1>
      <button @click="openWizard()"
              class="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)] transition-all flex items-center gap-2">
        <Plus class="w-5 h-5" /> {{ t('campaigns.new') }}
      </button>
    </div>

    <!-- Active Campaign Progress -->
    <div v-if="store.activeProgress" class="bg-surface-container/40 backdrop-blur-xl border border-primary/30 rounded-2xl p-6 relative overflow-hidden">
      <div class="absolute -top-16 -right-16 w-48 h-48 bg-primary/15 rounded-full blur-[80px] pointer-events-none"></div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-semibold text-on-surface">{{ t('campaigns.active_progress') }}</h3>
          <p class="text-sm text-on-surface-variant">{{ store.activeProgress.sentCount + store.activeProgress.failedCount }} / {{ store.activeProgress.totalCount }}</p>
        </div>
        <span class="text-2xl font-bold text-primary">{{ store.activeProgress.progress }}%</span>
      </div>
      <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
        <div class="h-full bg-gradient-to-r from-primary to-tertiary rounded-full transition-all duration-500"
             :style="{ width: store.activeProgress.progress + '%' }"></div>
      </div>
    </div>

    <!-- Campaigns Table -->
    <div class="bg-surface-container-high border border-white/10 rounded-2xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-on-surface-variant border-b border-white/10 bg-black/20">
            <tr>
              <th class="py-4 px-6 font-medium">#</th>
              <th class="py-4 px-6 font-medium">{{ t('campaigns.name_label') }}</th>
              <th class="py-4 px-6 font-medium">Template</th>
              <th class="py-4 px-6 font-medium">Stato</th>
              <th class="py-4 px-6 font-medium">Progresso</th>
              <th class="py-4 px-6 font-medium">Schedulazione</th>
              <th class="py-4 px-6 font-medium text-right">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">
            <template v-if="store.loading">
              <tr v-for="i in 3" :key="i" class="animate-pulse">
                <td colspan="7" class="py-6 px-6">
                  <div class="h-4 bg-white/5 rounded w-full"></div>
                </td>
              </tr>
            </template>
            <tr v-else-if="store.campaigns.length === 0">
              <td colspan="7" class="py-8 text-center text-on-surface-variant">Nessuna campagna trovata.</td>
            </tr>
            <tr v-else v-for="(campaign, idx) in store.campaigns" :key="campaign.id" class="hover:bg-white/5 transition-colors">
              <td class="py-4 px-6 text-on-surface-variant">{{ idx + 1 }}</td>
              <td class="py-4 px-6 font-semibold text-on-surface">{{ campaign.name }}</td>
              <td class="py-4 px-6 text-on-surface-variant">{{ campaign.template?.name || '—' }}</td>
              <td class="py-4 px-6">
                <span class="px-3 py-1 text-xs font-bold rounded-full" :class="statusClass(campaign.status)">
                  {{ campaign.status }}
                </span>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                  <div class="w-24 bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div class="h-full bg-primary rounded-full transition-all"
                         :style="{ width: campaign.totalCount > 0 ? ((campaign.sentCount + campaign.failedCount) / campaign.totalCount * 100) + '%' : '0%' }"></div>
                  </div>
                  <span class="text-xs text-on-surface-variant">{{ campaign.sentCount + campaign.failedCount }} / {{ campaign.totalCount }}</span>
                </div>
              </td>
              <td class="py-4 px-6 text-on-surface-variant text-xs">
                <span v-if="campaign.scheduledAt" class="flex items-center gap-1 text-primary">
                  <Clock class="w-3 h-3" /> {{ new Date(campaign.scheduledAt).toLocaleString() }}
                </span>
                <span v-else>—</span>
              </td>
              <td class="py-4 px-6">
                <div class="flex items-center justify-end gap-2">
                  <button @click="openLogs(campaign.id)"
                          class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-on-surface-variant transition-colors" title="Visualizza Log">
                    <Eye class="w-4 h-4" />
                  </button>
                  <button v-if="['SCHEDULED', 'COMPLETED', 'FAILED', 'PAUSED'].includes(campaign.status)" @click="openReschedule(campaign)"
                          class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-on-surface-variant transition-colors" title="Rischedula">
                    <Calendar class="w-4 h-4" />
                  </button>
                  <button v-if="campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED'" @click="openWizard(campaign)"
                          class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-on-surface-variant transition-colors" title="Modifica">
                    <Edit2 class="w-4 h-4" />
                  </button>
                  <button v-if="campaign.status !== 'RUNNING'" @click="handleDelete(campaign.id)"
                          class="p-2 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors" title="Elimina">
                    <Trash2 class="w-4 h-4" />
                  </button>
                  <button v-if="campaign.status === 'DRAFT' || campaign.status === 'PAUSED'" @click="store.startCampaign(campaign.id)"
                          :disabled="store.loading"
                          class="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50" title="Avvia">
                    <Play class="w-4 h-4" />
                  </button>
                  <button v-if="campaign.status === 'RUNNING'" @click="store.pauseCampaign(campaign.id)"
                          :disabled="store.loading"
                          class="p-2 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 transition-colors disabled:opacity-50" title="Pausa">
                    <Pause class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Create/Edit Campaign Wizard -->
    <Teleport to="body">
      <div v-if="showWizard" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showWizard = false">
        <div class="w-full max-w-xl bg-surface-container-high border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-in">
          <h3 class="text-lg font-bold text-on-surface mb-6">{{ isEditing ? 'Modifica Campagna' : t('campaigns.create_title') }}</h3>

          <!-- Step indicators -->
          <div class="flex justify-between relative mb-8 before:content-[''] before:absolute before:top-4 before:left-0 before:w-full before:h-1 before:bg-white/10 before:-z-10">
            <div v-for="(stepInfo, index) in ['Dettagli', 'Messaggio', 'Destinatari', 'Riepilogo']" :key="index" 
                 class="flex flex-col items-center gap-2">
              <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors border-2"
                   :class="wizardStep > index + 1 ? 'bg-primary border-primary text-on-primary' : wizardStep === index + 1 ? 'bg-surface-container-high border-primary text-primary' : 'bg-surface-container-high border-white/20 text-on-surface-variant'">
                <CheckCircle2 v-if="wizardStep > index + 1" class="w-4 h-4" />
                <span v-else>{{ index + 1 }}</span>
              </div>
              <span class="text-xs font-semibold" :class="wizardStep >= index + 1 ? 'text-primary' : 'text-on-surface-variant'">{{ stepInfo }}</span>
            </div>
          </div>

          <!-- Step 1: Name -->
          <div v-if="wizardStep === 1" class="space-y-4">
            <label class="block text-sm font-medium text-on-surface-variant">{{ t('campaigns.name_label') }}</label>
            <input v-model="formData.name" type="text" :placeholder="t('campaigns.name_placeholder')"
                   class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
          </div>

          <!-- Step 2: Template -->
          <div v-if="wizardStep === 2" class="space-y-4">
            <label class="block text-sm font-medium text-on-surface-variant">{{ t('campaigns.template_label') }}</label>
            <select v-model="formData.templateId"
                    class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none">
              <option value="" disabled>{{ t('campaigns.template_select') }}</option>
              <option v-for="tmpl in templates" :key="tmpl.id" :value="tmpl.id">{{ tmpl.name }}</option>
            </select>
            
            <div v-if="selectedTemplatePreview" class="mt-4 p-4 bg-black/20 border border-white/5 rounded-xl">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-semibold text-on-surface-variant uppercase tracking-widest">{{ t('campaigns.preview_label') }}</span>
                <button @click="regenerateSpintax" class="text-xs text-primary flex items-center gap-1 hover:text-primary-fixed-dim transition-colors" title="Genera un'altra variante Spintax">
                  Genera variante
                </button>
              </div>
              <div class="text-sm text-on-surface whitespace-pre-wrap leading-relaxed" v-html="selectedTemplatePreview"></div>
            </div>
          </div>

          <!-- Step 3: Target & Rate Limit -->
          <div v-if="wizardStep === 3" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-on-surface-variant mb-2">{{ t('campaigns.target_label', 'Destinatari') }}</label>
              <div class="space-y-2">
                <label class="flex items-center gap-2 text-sm text-on-surface cursor-pointer p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                       :class="{ 'bg-primary/10 border-primary/30': targetMode === 'ALL' }">
                  <input type="radio" value="ALL" v-model="targetMode" @change="formData.contactIds = 'ALL'" class="text-primary focus:ring-primary bg-black/50 border-white/20" />
                  <span>Tutti i contatti validi</span>
                </label>
                <label class="flex items-center gap-2 text-sm text-on-surface cursor-pointer p-3 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
                       :class="{ 'bg-primary/10 border-primary/30': targetMode === 'GROUPS' }">
                  <input type="radio" value="GROUPS" v-model="targetMode" @change="if(formData.contactIds === 'ALL') formData.contactIds = []" class="text-primary focus:ring-primary bg-black/50 border-white/20" />
                  <span>Seleziona Rubriche specifiche</span>
                </label>
              </div>
              
              <!-- Groups selector -->
              <div v-if="formData.contactIds !== 'ALL'" class="mt-3 p-4 bg-black/30 border border-white/10 rounded-lg space-y-2 max-h-48 overflow-y-auto">
                <div v-if="groupsStore.loading" class="text-center py-2"><Loader2 class="w-4 h-4 animate-spin mx-auto text-primary" /></div>
                <div v-else-if="groupsStore.groups.length === 0" class="text-center py-2 text-xs text-on-surface-variant">Nessuna rubrica disponibile.</div>
                <label v-else v-for="group in groupsStore.groups" :key="group.id" class="flex items-center gap-2 text-sm text-on-surface cursor-pointer hover:text-primary transition-colors">
                  <input type="checkbox" :value="'GROUP:' + group.id" v-model="formData.contactIds" class="rounded border-white/20 text-primary focus:ring-primary bg-black/50" />
                  {{ group.name }} ({{ group._count?.contacts || 0 }})
                </label>
              </div>
            </div>

            <label class="block text-sm font-medium text-on-surface-variant pt-2 border-t border-white/10">{{ t('campaigns.delay_label') }}</label>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-xs text-on-surface-variant">{{ t('campaigns.delay_min') }}</label>
                <input v-model.number="formData.delayMin" type="number" min="5" max="300"
                       class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
              </div>
              <div>
                <label class="text-xs text-on-surface-variant">{{ t('campaigns.delay_max') }}</label>
                <input v-model.number="formData.delayMax" type="number" min="10" max="600"
                       class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
              </div>
            </div>
            <p v-if="formData.delayMin >= formData.delayMax" class="text-xs text-error">Il ritardo minimo deve essere inferiore al massimo.</p>
          </div>

          <!-- Step 4: Schedule & Summary -->
          <div v-if="wizardStep === 4" class="space-y-6">
            <!-- Summary Card -->
            <div class="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
              <h4 class="text-sm font-bold text-primary flex items-center gap-2">
                <CheckCircle2 class="w-4 h-4" /> Riepilogo Campagna
              </h4>
              <div class="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span class="text-on-surface-variant text-xs block mb-1">Nome</span>
                  <span class="font-semibold text-on-surface">{{ formData.name }}</span>
                </div>
                <div>
                  <span class="text-on-surface-variant text-xs block mb-1">Template</span>
                  <span class="font-semibold text-on-surface">{{ templates.find(t => t.id === formData.templateId)?.name || '—' }}</span>
                </div>
                <div>
                  <span class="text-on-surface-variant text-xs block mb-1">Destinatari</span>
                  <span class="font-semibold text-on-surface">
                    <template v-if="formData.contactIds === 'ALL'">Tutti i contatti validi</template>
                    <template v-else>{{ formData.contactIds.length }} Rubrich{{ formData.contactIds.length === 1 ? 'a' : 'e' }} selezionat{{ formData.contactIds.length === 1 ? 'a' : 'e' }}</template>
                  </span>
                </div>
                <div>
                  <span class="text-on-surface-variant text-xs block mb-1">Ritardo tra i messaggi</span>
                  <span class="font-semibold text-on-surface">{{ formData.delayMin }}s - {{ formData.delayMax }}s</span>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <label class="block text-sm font-medium text-on-surface-variant">Programmazione (Opzionale)</label>
              <p class="text-xs text-on-surface-variant mb-2">Seleziona data e ora se vuoi che la campagna parta in automatico in futuro.</p>
              <input v-model="formData.scheduledAt" type="datetime-local"
                     class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
            </div>
          </div>

          <div class="flex flex-col gap-2 mt-6">
            <p v-if="wizardStep === 1 && !formData.name" class="text-xs text-error text-right">Inserisci il nome della campagna per proseguire.</p>
            <p v-if="wizardStep === 2 && !formData.templateId" class="text-xs text-error text-right">Seleziona un template per proseguire.</p>
            <div class="flex justify-between">
              <button @click="wizardStep > 1 ? wizardStep-- : showWizard = false"
                      class="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
                {{ wizardStep > 1 ? t('campaigns.btn_back') : t('campaigns.btn_cancel') }}
              </button>
              <button v-if="wizardStep < 4" @click="wizardStep++"
                      :disabled="(wizardStep === 1 && !formData.name) || (wizardStep === 2 && !formData.templateId) || (wizardStep === 3 && formData.delayMin >= formData.delayMax)"
                      class="px-5 py-2 bg-primary text-on-primary font-semibold rounded-lg transition-all disabled:opacity-30">
                {{ t('campaigns.btn_next') }}
              </button>
              <button v-else @click="handleSave"
                      class="px-5 py-2 bg-primary text-on-primary font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all">
                {{ isEditing ? 'Salva' : t('campaigns.btn_create') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Reschedule Modal -->
    <Teleport to="body">
      <div v-if="showRescheduleModal" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showRescheduleModal = false">
        <div class="w-full max-w-sm bg-surface-container-high border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-in">
          <h3 class="text-lg font-bold text-on-surface mb-4 flex items-center gap-2">
            <Calendar class="w-5 h-5 text-primary" />
            Rischedula Campagna
          </h3>
          <p class="text-sm text-on-surface-variant mb-4">Seleziona la nuova data e ora di avvio.</p>
          
          <input v-model="rescheduleForm.scheduledAt" type="datetime-local" required
                 class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none mb-6" />
                 
          <div class="flex justify-end gap-3">
            <button @click="showRescheduleModal = false" class="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">
              Annulla
            </button>
            <button @click="handleReschedule" class="px-5 py-2 bg-primary text-on-primary font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all">
              Conferma
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Improved Logs Modal -->
    <Teleport to="body">
      <div v-if="showLogsModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="showLogsModal = false">
        <div class="w-full max-w-4xl h-[80vh] flex flex-col bg-[#0d1117] border border-white/10 rounded-2xl shadow-2xl animate-slide-in overflow-hidden">
          <!-- Header -->
          <div class="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <h3 class="text-lg font-bold text-white flex items-center gap-2">
              <Eye class="w-5 h-5 text-primary" />
              Log Campagna
            </h3>
            <button @click="showLogsModal = false" class="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <!-- Terminal-like content -->
          <div class="flex-1 overflow-auto p-4 font-mono text-sm">
            <div v-if="logsLoading" class="flex items-center justify-center h-full">
              <div class="animate-pulse text-gray-500">Caricamento log in corso...</div>
            </div>
            <div v-else-if="campaignLogs.length === 0" class="flex items-center justify-center h-full text-gray-500">
              Nessun log disponibile per questa campagna.
            </div>
            <div v-else class="space-y-1">
              <!-- Logs Table Header -->
              <div class="grid grid-cols-12 gap-4 pb-2 border-b border-white/10 text-gray-400 font-semibold mb-2 px-2">
                <div class="col-span-3">Timestamp</div>
                <div class="col-span-3">Destinatario</div>
                <div class="col-span-2">Stato</div>
                <div class="col-span-4">Dettagli</div>
              </div>
              
              <!-- Logs Rows -->
              <div v-for="log in campaignLogs" :key="log.id" class="grid grid-cols-12 gap-4 py-2 px-2 hover:bg-white/5 rounded transition-colors items-start">
                <div class="col-span-3 text-gray-500 text-xs mt-0.5">
                  {{ new Date(log.createdAt).toLocaleString() }}
                </div>
                <div class="col-span-3 text-gray-300 truncate" :title="log.contact?.name">
                  {{ log.contact?.name || log.contactId }} <br/>
                  <span class="text-xs text-gray-500">{{ log.contact?.fullPhone }}</span>
                </div>
                <div class="col-span-2">
                  <span class="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-semibold"
                        :class="log.status === 'SENT' ? 'bg-primary/20 text-primary' : log.status === 'FAILED' ? 'bg-error/20 text-error' : 'bg-white/10 text-gray-300'">
                    <CheckCircle2 v-if="log.status === 'SENT'" class="w-3.5 h-3.5" />
                    <AlertCircle v-else-if="log.status === 'FAILED'" class="w-3.5 h-3.5" />
                    <Clock v-else class="w-3.5 h-3.5" />
                    {{ log.status }}
                  </span>
                </div>
                <div class="col-span-4 text-xs text-gray-400 break-words">
                  <div v-if="log.errorReason" class="text-error/90 whitespace-pre-wrap">{{ log.errorReason }}</div>
                  <div v-else-if="log.status === 'SENT'" class="text-primary/70">Messaggio inviato correttamente. ID: {{ log.wuzapiMsgId }}</div>
                  <div v-else>In attesa di elaborazione...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue'
import { useWhatsAppFormat } from '~/composables/useWhatsAppFormat'
import { Plus, Play, Pause, Eye, X, Clock, Edit2, Trash2, Calendar, CheckCircle2, AlertCircle } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useCampaignsStore } from '~/stores/campaigns'
import { useContactGroupsStore } from '~/stores/contactGroups'

const { t } = useI18n()
const store = useCampaignsStore()
const groupsStore = useContactGroupsStore()

const showWizard = ref(false)
const isEditing = ref(false)
const wizardStep = ref(1)
const templates = ref<any[]>([])

const initialForm = { id: '', name: '', templateId: '', delayMin: 15, delayMax: 45, scheduledAt: '', contactIds: 'ALL' as any }
const formData = ref({ ...initialForm })
const targetMode = ref<'ALL'|'GROUPS'>('ALL')

const showRescheduleModal = ref(false)
const rescheduleForm = ref({ id: '', scheduledAt: '' })

const showLogsModal = ref(false)
const logsLoading = ref(false)
const campaignLogs = ref<any[]>([])
const addToast = inject('addToast') as Function

async function openLogs(campaignId: string) {
  showLogsModal.value = true
  logsLoading.value = true
  campaignLogs.value = []
  try {
    const res = await $fetch<{ data: any[] }>(`/api/campaigns/${campaignId}/messages`)
    campaignLogs.value = res.data
  } catch (e: any) {
    addToast('Errore durante il caricamento dei log', 'error')
  } finally {
    logsLoading.value = false
  }
}

function openWizard(campaign?: any) {
  wizardStep.value = 1
  if (campaign) {
    isEditing.value = true
    let parsedContacts = campaign.contactIds || 'ALL'
    try { if (typeof parsedContacts === 'string' && parsedContacts !== 'ALL') parsedContacts = JSON.parse(parsedContacts) } catch(e){}
    targetMode.value = parsedContacts === 'ALL' ? 'ALL' : 'GROUPS'
    
    formData.value = {
      id: campaign.id,
      name: campaign.name,
      templateId: campaign.templateId,
      delayMin: campaign.delayMin,
      delayMax: campaign.delayMax,
      contactIds: parsedContacts,
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ''
    }
  } else {
    isEditing.value = false
    targetMode.value = 'ALL'
    formData.value = { ...initialForm }
  }
  showWizard.value = true
}

const editCampaign = (campaign: any) => {
  isEditing.value = true
  let parsedContacts = campaign.contactIds || 'ALL'
  try { if (typeof parsedContacts === 'string' && parsedContacts !== 'ALL') parsedContacts = JSON.parse(parsedContacts) } catch(e){}
  targetMode.value = parsedContacts === 'ALL' ? 'ALL' : 'GROUPS'
  
  formData.value = {
    id: campaign.id,
    name: campaign.name,
    templateId: campaign.templateId,
    delayMin: campaign.delayMin,
    delayMax: campaign.delayMax,
    contactIds: parsedContacts,
    scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ''
  }
  showWizard.value = true
}

function openReschedule(campaign: any) {
  rescheduleForm.value = {
    id: campaign.id,
    scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ''
  }
  showRescheduleModal.value = true
}

async function handleReschedule() {
  if (!rescheduleForm.value.scheduledAt) {
    addToast('Inserisci una data e ora valida', 'error')
    return
  }
  
  try {
    await store.updateCampaign(rescheduleForm.value.id, {
      scheduledAt: new Date(rescheduleForm.value.scheduledAt).toISOString()
    })
    addToast('Campagna rischedulata', 'success')
    showRescheduleModal.value = false
  } catch (e: any) {
    addToast(e.data?.message || 'Errore durante la rischedulazione', 'error')
  }
}

async function handleDelete(id: string) {
  if (confirm('Sei sicuro di voler eliminare questa campagna? Verranno eliminati anche tutti i log associati.')) {
    try {
      await store.deleteCampaign(id)
      addToast('Campagna eliminata', 'success')
    } catch (e: any) {
      addToast(e.data?.message || 'Errore durante l\'eliminazione', 'error')
    }
  }
}
const { formatWhatsAppText, renderSpintax } = useWhatsAppFormat()
const spintaxTrigger = ref(0)

const selectedTemplatePreview = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  spintaxTrigger.value // Track dependency
  const tmpl = templates.value.find(t => t.id === formData.value.templateId)
  return tmpl ? formatWhatsAppText(renderSpintax(tmpl.body)) : ''
})

function regenerateSpintax() {
  spintaxTrigger.value++
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    DRAFT: 'bg-white/10 text-on-surface-variant',
    SCHEDULED: 'bg-blue-500/20 text-blue-400',
    RUNNING: 'bg-primary/20 text-primary animate-glow-pulse',
    PAUSED: 'bg-yellow-500/20 text-yellow-400',
    COMPLETED: 'bg-tertiary/20 text-tertiary',
    FAILED: 'bg-error/20 text-error',
  }
  return map[status] || map.DRAFT
}

async function handleSave() {
  const payload: any = { ...formData.value }
  delete payload.id
  
  if (!payload.scheduledAt) delete payload.scheduledAt
  else payload.scheduledAt = new Date(payload.scheduledAt).toISOString()

  try {
    if (isEditing.value) {
      await store.updateCampaign(formData.value.id, payload)
      addToast('Campagna aggiornata', 'success')
    } else {
      await store.createCampaign(payload)
      addToast('Campagna creata', 'success')
    }
    showWizard.value = false
    wizardStep.value = 1
    formData.value = { ...initialForm }
  } catch (e: any) {
    addToast(e.data?.message || 'Errore durante il salvataggio', 'error')
  }
}

onMounted(async () => {
  store.fetchCampaigns()
  groupsStore.fetchGroups()
  try {
    const res = await $fetch<{ data: any[] }>('/api/templates')
    templates.value = res.data
  } catch { /* silent */ }
})
</script>
