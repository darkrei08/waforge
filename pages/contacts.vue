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
        <button @click="showCsvInfo = true"
                class="px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-semibold rounded-lg border border-primary/20 transition-all" title="Info formato CSV">
          <Info class="w-4 h-4 inline mr-1" /> Info CSV
        </button>
        <button @click="handleExport"
                class="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-on-surface text-sm font-semibold rounded-lg border border-white/10 transition-all">
          <Download class="w-4 h-4 inline mr-1" /> {{ t('contacts.export_csv') }}
        </button>
        <button @click="openImportModal()"
                class="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-on-surface text-sm font-semibold rounded-lg border border-white/10 transition-all">
          <Upload class="w-4 h-4 inline mr-1" /> {{ t('contacts.import_csv') }}
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
      <input v-model="store.search" @input="debouncedSearch" type="text" :placeholder="t('contacts.search_placeholder')"
             class="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-white/10 rounded-lg text-on-surface text-sm placeholder-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all" />
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
            <th class="p-4 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{{ t('contacts.th_status') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-if="store.loading">
            <tr v-for="i in 5" :key="i" class="border-b border-white/5">
              <td colspan="6" class="p-4"><div class="h-4 bg-white/5 rounded animate-pulse"></div></td>
            </tr>
          </template>
          <template v-else>
            <tr v-for="contact in store.contacts" :key="contact.id"
              class="border-b border-white/5 hover:bg-white/5 transition-colors">
            <td class="p-4">
              <input type="checkbox" :checked="store.selected.has(contact.id)" @change="store.toggleSelect(contact.id)"
                     class="rounded border-white/20 bg-white/5" />
            </td>
            <td class="p-4 text-sm font-medium text-on-surface">{{ contact.name }}</td>
            <td class="p-4 text-sm text-on-surface-variant font-mono">{{ contact.prefix }}{{ contact.phone }}</td>
            <td class="p-4 text-sm text-on-surface-variant">{{ contact.email || '—' }}</td>
            <td class="p-4 text-sm text-on-surface-variant">{{ contact.company || '—' }}</td>
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
            <button @click="showImport = false" class="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors" :disabled="isImporting">{{ t('contacts.btn_cancel') }}</button>
            <button @click="handleImport" :disabled="!csvText.trim() || isImporting"
                    class="px-4 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-fixed-dim transition-all disabled:opacity-30 flex items-center gap-2">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Upload, Trash2, Search, Download, X, Info, Loader2 } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useContactsStore } from '~/stores/contacts'
import { useWhatsAppFormat } from '~/composables/useWhatsAppFormat'

const { t } = useI18n()
const store = useContactsStore()
const { csvTemplateHeaders } = useWhatsAppFormat()

const showImport = ref(false)
const showCsvInfo = ref(false)
const csvText = ref('')
const fileName = ref('')
const importResult = ref<any>(null)
const importError = ref<string | null>(null)
const isImporting = ref(false)

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
    importResult.value = await store.importCSV(csvText.value)
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
  const sample = 'Mario Rossi,39,3331234567,mario@azienda.com,Azienda SpA'
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

onMounted(() => store.fetchContacts())
</script>
