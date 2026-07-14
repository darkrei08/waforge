<template>
  <div class="p-8 space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-on-surface tracking-tight">{{ t('contacts.title') }}</h1>
        <p class="text-on-surface-variant mt-1">{{ t('contacts.total', { count: store.pagination.total }) }}</p>
      </div>
      <div class="flex gap-3">
        <button v-if="store.hasSelection" @click="handleBulkDelete"
                class="px-4 py-2.5 bg-error/20 hover:bg-error/30 text-error text-sm font-semibold rounded-lg border border-error/30 transition-all">
          <Trash2 class="w-4 h-4 inline mr-1" /> {{ t('contacts.delete_selected', { count: store.selected.size }) }}
        </button>
        <button @click="showPrefixes = true"
                class="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold rounded-lg border border-primary/20 transition-all" title="Prefissi Internazionali">
          <Globe class="w-4 h-4 inline mr-1" /> Prefissi
        </button>
        <button @click="showGroupsPanel = true"
                class="px-4 py-2.5 bg-secondary/10 hover:bg-secondary/20 text-secondary text-sm font-semibold rounded-lg border border-secondary/20 transition-all" title="Gestisci Rubriche">
          <Users class="w-4 h-4 inline mr-1" /> Rubriche
        </button>
        <button @click="handleVerify" :disabled="isVerifying"
                class="px-4 py-2.5 bg-primary/20 hover:bg-primary/30 text-primary text-sm font-semibold rounded-lg border border-primary/30 transition-all">
          <Loader2 v-if="isVerifying" class="w-4 h-4 inline mr-1 animate-spin" />
          <CheckCircle2 v-else class="w-4 h-4 inline mr-1" /> Verifica Numeri
        </button>
        <button @click="showCsvInfo = true" class="btn-secondary text-sm" title="Info formato CSV">
          <Info class="w-4 h-4 inline mr-1" /> Info CSV
        </button>
        <button @click="handleExport" class="btn-secondary text-sm">
          <Download class="w-4 h-4 inline mr-1" /> {{ t('contacts.export_csv') }}
        </button>
        <button @click="openImportModal()" class="btn-secondary text-sm">
          <Upload class="w-4 h-4 inline mr-1" /> {{ t('contacts.import_csv') }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-4 mb-6">
      <!-- Search -->
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
        <input v-model="store.search" @input="debouncedSearch" type="text" :placeholder="t('contacts.search_placeholder')"
               class="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-white/10 rounded-lg text-on-surface text-sm placeholder-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all" />
      </div>
      
      <!-- Rubrica Filter -->
      <div class="relative w-64">
        <select v-model="store.selectedGroupId" @change="store.fetchContacts(1)" class="w-full px-4 py-2.5 appearance-none bg-surface-container border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all cursor-pointer">
          <option :value="undefined">Tutte le rubriche</option>
          <option v-for="group in groupsStore.groups" :key="group.id" :value="group.id">{{ group.name }}</option>
        </select>
        <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <svg class="w-4 h-4 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
        </div>
      </div>
    </div>

    <!-- Dashboard Statistiche Verifica -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <div @click="activeFilter = 'all'" 
           class="p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-center items-center gap-1"
           :class="activeFilter === 'all' ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-surface-container border-white/10 hover:border-white/20 text-on-surface'">
        <Users class="w-6 h-6 mb-1 opacity-70" />
        <span class="text-xs font-semibold uppercase tracking-wider opacity-70">Totale</span>
        <span class="text-2xl font-bold">{{ store.contacts.length }}</span>
      </div>
      <div @click="activeFilter = 'pending'" 
           class="p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-center items-center gap-1"
           :class="activeFilter === 'pending' ? 'bg-white/20 border-white/50 text-white' : 'bg-surface-container border-white/10 hover:border-white/20 text-on-surface-variant'">
        <HelpCircle class="w-6 h-6 mb-1 opacity-70" />
        <span class="text-xs font-semibold uppercase tracking-wider opacity-70">Da Verificare</span>
        <span class="text-2xl font-bold">{{ stats.pending }}</span>
      </div>
      <div @click="activeFilter = 'valid'" 
           class="p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-center items-center gap-1"
           :class="activeFilter === 'valid' ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-surface-container border-white/10 hover:border-white/20 text-primary/70'">
        <CheckCircle2 class="w-6 h-6 mb-1 opacity-70" />
        <span class="text-xs font-semibold uppercase tracking-wider opacity-70">Validi (WA)</span>
        <span class="text-2xl font-bold">{{ stats.valid }}</span>
      </div>
      <div @click="activeFilter = 'invalid'" 
           class="p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-center items-center gap-1"
           :class="activeFilter === 'invalid' ? 'bg-error/20 border-error/50 text-error' : 'bg-surface-container border-white/10 hover:border-white/20 text-error/70'">
        <XCircle class="w-6 h-6 mb-1 opacity-70" />
        <span class="text-xs font-semibold uppercase tracking-wider opacity-70">Inesistenti</span>
        <span class="text-2xl font-bold">{{ stats.invalid }}</span>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      <table class="w-full">
        <thead>
          <tr class="border-b border-white/5">
            <th class="p-4 text-left">
              <input type="checkbox" @change="store.selected.size === store.contacts.length ? store.clearSelection() : store.selectAll()"
                     :checked="store.selected.size === store.contacts.length && store.contacts.length > 0"
                     class="rounded border-white/20 bg-white/5" />
            </th>
            <th class="p-4 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{{ t('contacts.th_name') }}</th>
            <th class="p-4 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{{ t('contacts.th_phone') }}</th>
            <th class="p-4 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{{ t('contacts.th_email') }}</th>
            <th class="p-4 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{{ t('contacts.th_company') }}</th>
            <th class="p-4 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">WhatsApp</th>
            <th class="p-4 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Consenso</th>
            <th class="p-4 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{{ t('contacts.th_status') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="store.loading">
            <tr v-for="i in 5" :key="i" class="border-b border-white/5">
              <td colspan="7" class="p-4"><div class="h-4 bg-white/5 rounded animate-pulse"></div></td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="contact in filteredContacts" :key="contact.id"
              class="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td class="p-4">
              <input type="checkbox" :checked="store.selected.has(contact.id)" @change="store.toggleSelect(contact.id)"
                     class="rounded border-white/20 bg-white/5" />
            </td>
            <td class="p-4 text-sm font-medium text-on-surface">{{ contact.name }}</td>
            <td class="p-4 text-sm text-on-surface-variant font-mono">
              <div class="flex flex-col gap-1.5">
                <div class="flex items-center gap-2">
                  <span class="font-bold text-white">+{{ contact.fullPhone }}</span>
                </div>
                <!-- Secondary Phones list -->
                <div v-if="getSecondaryPhonesList(contact).length > 0" class="flex flex-wrap gap-1">
                  <span v-for="(sp, sIdx) in getSecondaryPhonesList(contact)" :key="sIdx" 
                        class="px-2 py-0.5 text-xs bg-black/40 rounded border border-white/10 text-gray-300 flex items-center gap-1.5">
                    <span>+{{ sp }}</span>
                    <button @click="removeSecondaryPhone(contact, sIdx)" title="Rimuovi questo numero" class="text-error hover:text-red-400 font-bold ml-1">×</button>
                  </span>
                </div>
                <!-- Add secondary form inline -->
                <div v-if="addingPhoneFor === contact.id" class="flex items-center gap-1 mt-1">
                  <input v-model="newSecondaryPhoneInput" placeholder="+39333..." @keyup.enter="saveSecondaryPhone(contact)" 
                         class="w-28 px-2 py-1 text-xs bg-black/60 border border-primary/50 rounded text-white font-mono outline-none" />
                  <button @click="saveSecondaryPhone(contact)" class="px-2 py-1 bg-primary text-black text-xs font-bold rounded hover:brightness-110">✔</button>
                  <button @click="addingPhoneFor = null" class="px-2 py-1 bg-white/10 text-gray-300 text-xs rounded hover:bg-white/20">✕</button>
                </div>
                <button v-else @click="openAddSecondaryPhone(contact)" class="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5 w-fit">
                  + Aggiungi Altro Numero
                </button>
              </div>
            </td>
            <td class="p-4 text-sm text-on-surface-variant">{{ contact.email || '—' }}</td>
            <td class="p-4 text-sm text-on-surface-variant">{{ contact.company || '—' }}</td>
            <td class="p-4">
              <span v-if="contact.isOnWhatsApp === true" class="px-2 py-1 text-xs font-bold rounded-full bg-primary/20 text-primary">Sì</span>
              <span v-else-if="contact.isOnWhatsApp === false" class="px-2 py-1 text-xs font-bold rounded-full bg-error/20 text-error">No</span>
              <span v-else class="px-2 py-1 text-xs font-bold rounded-full bg-white/10 text-on-surface-variant">?</span>
            </td>
            <td class="p-4">
              <select v-model="contact.consentStatus" @change="updateConsent(contact)" class="bg-transparent text-xs font-bold rounded-full px-2 py-1 outline-none border-none cursor-pointer"
                      :class="{
                        'bg-primary/20 text-primary': contact.consentStatus === 'GRANTED',
                        'bg-error/20 text-error': contact.consentStatus === 'DENIED',
                        'bg-white/10 text-on-surface-variant': contact.consentStatus === 'PENDING'
                      }">
                <option value="PENDING" class="bg-surface-container text-on-surface">IN ATTESA</option>
                <option value="GRANTED" class="bg-surface-container text-on-surface">CONSENTE</option>
                <option value="DENIED" class="bg-surface-container text-on-surface">NEGATO</option>
              </select>
            </td>
            <td class="p-4">
              <span class="px-2 py-1 text-xs font-bold rounded-full"
                    :class="contact.isActive ? 'bg-primary/20 text-primary' : 'bg-white/10 text-on-surface-variant'">
                {{ contact.isActive ? t('contacts.status_active') : t('contacts.status_inactive') }}
              </span>
            </td>
            </tr>
          </template>
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="flex items-center justify-between p-4 border-t border-white/5">
        <p class="text-sm text-on-surface-variant">
          {{ t('contacts.page_info', { page: store.pagination.page, total: store.pagination.totalPages }) }}
        </p>
        <div class="flex gap-2">
          <button @click="store.fetchContacts(store.pagination.page - 1)"
                  :disabled="store.pagination.page <= 1"
                  class="px-3 py-1.5 text-sm bg-white/5 rounded-lg disabled:opacity-30 hover:bg-white/10 transition-colors">
            {{ t('contacts.btn_prev') }}
          </button>
          <button @click="store.fetchContacts(store.pagination.page + 1)"
                  :disabled="store.pagination.page >= store.pagination.totalPages"
                  class="px-3 py-1.5 text-sm bg-white/5 rounded-lg disabled:opacity-30 hover:bg-white/10 transition-colors">
            {{ t('contacts.btn_next') }}
          </button>
        </div>
      </div>
    </div>

    <!-- CSV Import Modal -->
    <Teleport to="body">
      <div v-if="showImport" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showImport = false">
        <div class="w-full max-w-lg bg-surface-container-high border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-in">
          <h3 class="text-lg font-bold text-on-surface mb-4">{{ t('contacts.import_title') }}</h3>
          
          <div class="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-xl">
            <h4 class="text-sm font-semibold text-primary mb-2 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Formato CSV Richiesto
            </h4>
            <div class="space-y-2">
              <div v-for="header in csvTemplateHeaders" :key="header.name" class="flex items-start gap-2 text-sm">
                <code class="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{{ header.name }}</code>
                <span class="text-on-surface-variant flex-1">
                  {{ header.description }}
                  <span v-if="header.required" class="text-error font-semibold text-xs ml-1">(Obbligatorio)</span>
                </span>
              </div>
            </div>
            <button @click="downloadCsvTemplate" class="mt-4 text-sm text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-1">
              <Download class="w-4 h-4" /> Scarica Template CSV
            </button>
          </div>

          <div 
            class="relative border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors"
            @dragover.prevent
            @drop.prevent="handleDrop"
          >
            <input type="file" accept=".csv,.txt" class="absolute inset-0 w-full h-full opacity-0 cursor-pointer" @change="handleFileChange" />
            <div class="flex flex-col items-center justify-center space-y-3 pointer-events-none">
              <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <Upload class="w-6 h-6 text-on-surface-variant" />
              </div>
              <div>
                <p class="text-sm font-medium text-on-surface">Trascina qui il file CSV</p>
                <p class="text-xs text-on-surface-variant">oppure clicca per selezionare dal disco</p>
              </div>
            </div>
          </div>

          <div v-if="fileName" class="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
            <span class="text-sm text-on-surface font-mono truncate">{{ fileName }}</span>
            <button @click="clearFile" class="text-on-surface-variant hover:text-error"><X class="w-4 h-4" /></button>
          </div>

          <div v-if="importError" class="mt-4 p-3 rounded-lg bg-error/10 text-sm text-error border border-error/20">
            {{ importError }}
          </div>
          <div v-else-if="importResult" class="mt-4 p-3 rounded-lg bg-primary/10 text-sm text-on-surface border border-primary/20">
            {{ t('contacts.import_result', { imported: importResult.imported, skipped: importResult.skipped, errors: importResult.errors?.length || 0 }) }}
          </div>
          <div class="flex justify-end gap-3 mt-4">
            <button @click="showImport = false" class="btn-secondary text-sm" :disabled="isImporting">{{ t('contacts.btn_cancel') }}</button>
            <button @click="handleImport" :disabled="!csvText.trim() || isImporting" class="btn-primary">
              <Loader2 v-if="isImporting" class="w-4 h-4 animate-spin" />
              {{ t('contacts.btn_import') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- CSV Info Modal -->
    <Teleport to="body">
      <div v-if="showCsvInfo" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showCsvInfo = false">
        <div class="w-full max-w-lg bg-surface-container-high border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-in">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-on-surface flex items-center gap-2">
              <Info class="w-5 h-5 text-primary" /> Info Formato CSV
            </h3>
            <button @click="showCsvInfo = false" class="text-on-surface-variant hover:text-on-surface">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <div class="p-4 bg-primary/5 border border-primary/20 rounded-xl space-y-3">
            <p class="text-sm text-on-surface-variant mb-4">
              Per importare correttamente i contatti, il file CSV deve contenere la seguente struttura di colonne nella prima riga:
            </p>
            <div class="space-y-2">
              <div v-for="header in csvTemplateHeaders" :key="header.name" class="flex items-start gap-2 text-sm">
                <code class="font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{{ header.name }}</code>
                <span class="text-on-surface-variant flex-1">
                  {{ header.description }}
                  <span v-if="header.required" class="text-error font-semibold text-xs ml-1">(Obbligatorio)</span>
                </span>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end mt-6">
            <button @click="downloadCsvTemplate" class="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-fixed-dim transition-all flex items-center gap-2">
              <Download class="w-4 h-4" /> Scarica Template CSV
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Prefixes Component -->
    <InternationalPrefixes :is-open="showPrefixes" @close="showPrefixes = false" />

    <!-- Groups Panel -->
    <ContactGroupsPanel 
      :is-open="showGroupsPanel" 
      :selected-count="store.selected.size"
      @close="showGroupsPanel = false" 
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { Upload, Trash2, Search, Download, X, Info, Loader2, CheckCircle2, Globe, Users, HelpCircle, XCircle } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useContactsStore } from '~/stores/contacts'
import { useContactGroupsStore } from '~/stores/contactGroups'
import { useWhatsAppFormat } from '~/composables/useWhatsAppFormat'
import InternationalPrefixes from '~/components/InternationalPrefixes.vue'
import ContactGroupsPanel from '~/components/ContactGroupsPanel.vue'

const { t } = useI18n()
const store = useContactsStore()
const groupsStore = useContactGroupsStore()
const { csvTemplateHeaders } = useWhatsAppFormat()
const addToast = inject('addToast') as Function

const showImport = ref(false)
const showCsvInfo = ref(false)
const showPrefixes = ref(false)
const showGroupsPanel = ref(false)
const csvText = ref('')
const fileName = ref('')
const importResult = ref<any>(null)
const importError = ref<string | null>(null)
const isImporting = ref(false)

// Dashboard Stats & Filters
const activeFilter = ref<'all' | 'pending' | 'valid' | 'invalid'>('all')

const stats = computed(() => {
  let pending = 0
  let valid = 0
  let invalid = 0
  store.contacts.forEach(c => {
    if (c.isOnWhatsApp === true) valid++
    else if (c.isOnWhatsApp === false) invalid++
    else pending++
  })
  return { pending, valid, invalid }
})

const filteredContacts = computed(() => {
  let list = store.contacts
  if (activeFilter.value === 'pending') {
    list = list.filter(c => c.isOnWhatsApp === null)
  } else if (activeFilter.value === 'valid') {
    list = list.filter(c => c.isOnWhatsApp === true)
  } else if (activeFilter.value === 'invalid') {
    list = list.filter(c => c.isOnWhatsApp === false)
  }
  return list
})

function openImportModal() {
  // Reset all state when opening the modal
  csvText.value = ''
  fileName.value = ''
  importResult.value = null
  importError.value = null
  isImporting.value = false
  showImport.value = true
}

let debounceTimer: ReturnType<typeof setTimeout>
function debouncedSearch() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => store.fetchContacts(1), 400)
}

function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) readFile(file)
}

function handleDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file) readFile(file)
}

function readFile(file: File) {
  fileName.value = file.name
  const reader = new FileReader()
  reader.onload = (e) => {
    csvText.value = e.target?.result as string
  }
  reader.readAsText(file)
}

function clearFile() {
  fileName.value = ''
  csvText.value = ''
  importResult.value = null
  importError.value = null
}

async function handleImport() {
  if (!csvText.value.trim() || isImporting.value) return
  isImporting.value = true
  importError.value = null
  importResult.value = null
  
  try {
    importResult.value = await store.importCSV(csvText.value, store.selectedGroupId)
    // Refresh the contacts table
    await store.fetchContacts(1)
    // Close modal after a brief delay so user can see the result
    setTimeout(() => {
      showImport.value = false
    }, 1500)
  } catch (err: any) {
    importError.value = err.data?.message || err.message || 'Errore durante l\'importazione del file.'
  } finally {
    isImporting.value = false
  }
}

function downloadCsvTemplate() {
  const headers = csvTemplateHeaders.map(h => h.name).join(',')
  const sample = 'Mario Rossi,39,3331234567,3339876543,3341122334,,mario@azienda.com,Azienda SpA'
  const blob = new Blob([`${headers}\n${sample}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', 'template_contatti.csv')
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

async function handleBulkDelete() {
  if (!confirm(t('contacts.confirm_delete', { count: store.selected.size }))) return
  await store.deleteContacts([...store.selected])
}

function handleExport() {
  const url = store.search ? `/api/contacts/export?search=${encodeURIComponent(store.search)}` : '/api/contacts/export'
  window.open(url, '_blank')
}

const isVerifying = ref(false)
async function handleVerify() {
  isVerifying.value = true
  try {
    const contactIds = store.hasSelection ? Array.from(store.selected) : undefined
    const res = await $fetch<{ data: { enqueued: number } }>('/api/contacts/verify', {
      method: 'POST',
      body: { contactIds }
    })
    addToast(`${res.data.enqueued} contatti accodati per la verifica in background.`, 'success')
    store.clearSelection()
  } catch (err: any) {
    addToast(err.data?.message || err.message || 'Errore durante l\'avvio della verifica', 'error')
  } finally {
    isVerifying.value = false
  }
}

async function updateConsent(contact: any) {
  try {
    await $fetch(`/api/contacts/${contact.id}`, {
      method: 'PUT',
      body: { consentStatus: contact.consentStatus }
    })
    addToast('Stato consenso aggiornato', 'success')
  } catch(e: any) {
    addToast('Errore aggiornamento consenso', 'error')
  }
}

// ── Multi-Telefono & Numeri Secondari ──
const addingPhoneFor = ref<string | null>(null)
const newSecondaryPhoneInput = ref('')

function getSecondaryPhonesList(contact: any): string[] {
  if (!contact.secondaryPhones) return []
  try {
    const parsed = typeof contact.secondaryPhones === 'string' ? JSON.parse(contact.secondaryPhones) : contact.secondaryPhones
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return contact.secondaryPhones.split(',').map((s: string) => s.trim().replace(/\D/g, '')).filter(Boolean)
  }
}

function openAddSecondaryPhone(contact: any) {
  addingPhoneFor.value = contact.id
  newSecondaryPhoneInput.value = '+39'
}

async function saveSecondaryPhone(contact: any) {
  if (!newSecondaryPhoneInput.value.trim() || newSecondaryPhoneInput.value.trim() === '+39') return
  const current = getSecondaryPhonesList(contact)
  const clean = newSecondaryPhoneInput.value.trim().replace(/[^\d+]/g, '').replace(/^\+/, '')
  if (clean && !current.includes(clean)) {
    const updatedList = [...current, clean]
    try {
      await $fetch(`/api/contacts/${contact.id}`, {
        method: 'PUT',
        body: { secondaryPhones: updatedList }
      })
      contact.secondaryPhones = JSON.stringify(updatedList)
      addToast('Numero secondario aggiunto con successo', 'success')
    } catch {
      addToast('Errore durante il salvataggio del numero', 'error')
    }
  }
  addingPhoneFor.value = null
  newSecondaryPhoneInput.value = ''
}

async function removeSecondaryPhone(contact: any, idx: number) {
  const current = getSecondaryPhonesList(contact)
  current.splice(idx, 1)
  try {
    await $fetch(`/api/contacts/${contact.id}`, {
      method: 'PUT',
      body: { secondaryPhones: current }
    })
    contact.secondaryPhones = JSON.stringify(current)
    addToast('Numero rimosso', 'success')
  } catch {
    addToast('Errore durante la rimozione', 'error')
  }
}

onMounted(() => {
  store.fetchContacts()
  groupsStore.fetchGroups()
})
</script>
