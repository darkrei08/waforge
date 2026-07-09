<template>
  <div class="p-8 space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-on-surface tracking-tight">{{ t('nav.templates') }}</h1>
      <button @click="openWizard()"
              class="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)] transition-all flex items-center gap-2">
        <Plus class="w-5 h-5" /> {{ t('templates.new') }}
      </button>
    </div>

    <!-- Templates List -->
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-if="store.loading" v-for="i in 3" :key="i" class="bg-surface-container/40 border border-white/10 rounded-2xl p-6">
        <div class="h-5 bg-white/5 rounded w-1/3 animate-pulse mb-3"></div>
        <div class="h-16 bg-white/5 rounded w-full animate-pulse"></div>
      </div>

      <div v-else v-for="tmpl in store.templates" :key="tmpl.id"
           class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-on-surface text-lg">{{ tmpl.name }}</h3>
            <div class="flex gap-2">
              <button @click="openWizard(tmpl)" class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-on-surface transition-colors">
                <Edit2 class="w-4 h-4" />
              </button>
              <button @click="handleDelete(tmpl.id)" class="p-2 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p class="text-xs text-on-surface-variant mb-4">{{ tmpl.description || t('templates.no_description') }}</p>
          <div class="bg-black/20 p-3 rounded-lg border border-white/5 max-h-32 overflow-y-auto">
            <div class="text-sm text-on-surface whitespace-pre-wrap leading-relaxed" v-html="formatWhatsAppText(tmpl.body)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showWizard" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showWizard = false">
        <div class="w-full max-w-2xl bg-surface-container-high border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-in">
          <h3 class="text-lg font-bold text-on-surface mb-6">{{ isEditing ? t('templates.edit_title') : t('templates.create_title') }}</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-on-surface-variant mb-1">{{ t('templates.name_label') }}</label>
              <input v-model="formData.name" type="text" :placeholder="t('templates.name_placeholder')"
                     class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
            </div>

            <div>
              <label class="block text-sm font-medium text-on-surface-variant mb-1">{{ t('templates.description_label') }}</label>
              <input v-model="formData.description" type="text" :placeholder="t('templates.description_placeholder')"
                     class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-on-surface-variant mb-1">Tipo Media (Opzionale)</label>
                <select v-model="formData.mediaType" class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none appearance-none">
                  <option value="text">Nessun Media (Solo Testo)</option>
                  <option value="image">Immagine</option>
                  <option value="video">Video</option>
                  <option value="document">Documento</option>
                  <option value="audio">Audio</option>
                </select>
              </div>
              <div v-if="formData.mediaType !== 'text'">
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-sm font-medium text-on-surface-variant">Sorgente File</label>
                  <div class="flex items-center gap-2 text-xs">
                    <button @click="uploadMode = 'url'" :class="uploadMode === 'url' ? 'text-primary' : 'text-on-surface-variant'" class="hover:text-primary transition-colors">URL Link</button>
                    <span class="text-white/20">|</span>
                    <button @click="uploadMode = 'file'" :class="uploadMode === 'file' ? 'text-primary' : 'text-on-surface-variant'" class="hover:text-primary transition-colors">Carica File</button>
                  </div>
                </div>

                <div v-if="uploadMode === 'url'">
                  <input v-model="formData.mediaUrl" type="url" placeholder="https://esempio.com/file.jpg"
                         class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
                </div>
                
                <div v-else>
                  <label class="relative flex items-center justify-center w-full p-3 bg-black/30 border border-dashed border-white/20 hover:border-primary/50 rounded-lg cursor-pointer transition-colors" :class="{ 'opacity-50 pointer-events-none': isUploading }">
                    <input type="file" class="hidden" @change="handleFileUpload" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
                    <div class="flex items-center gap-2 text-sm text-on-surface-variant">
                      <Loader2 v-if="isUploading" class="w-4 h-4 animate-spin text-primary" />
                      <Upload v-else class="w-4 h-4" />
                      <span v-if="isUploading">Caricamento in corso...</span>
                      <span v-else-if="formData.mediaUrl" class="text-primary truncate max-w-[200px]">File caricato ({{ formData.mediaUrl.split('/').pop() }})</span>
                      <span v-else>Clicca per scegliere un file</span>
                    </div>
                  </label>
                  <p class="text-[11px] text-on-surface-variant mt-1 text-center">Max 5MB consigliato</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-on-surface-variant mb-1">{{ t('templates.body_label') }}</label>
                <textarea v-model="formData.body" rows="6" :placeholder="t('templates.body_placeholder')"
                          class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none whitespace-pre-wrap"></textarea>
                <div class="mt-2 p-3 bg-white/5 border border-white/10 rounded-lg flex items-start gap-2">
                  <Info class="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span class="block font-medium text-sm text-on-surface mb-1">Legenda Variabili / Formattazione</span>
                    <ul class="space-y-1 text-xs text-on-surface-variant" v-pre>
                      <li><code>{{Name}}</code> - Nome del contatto</li>
                      <li><code>{{Phone}}</code> - Numero di telefono</li>
                      <li><code>{{Email}}</code> - Indirizzo Email</li>
                      <li><code>{{Company}}</code> - Nome azienda (se presente)</li>
                    </ul>
                    <div class="mt-3 text-[11px] text-on-surface-variant leading-relaxed">
                      <strong class="text-on-surface">Formattazione testo WhatsApp supportata:</strong><br/>
                      • <code>*grassetto*</code>, <code>_corsivo_</code>, <code>~barrato~</code><br/>
                      • <code>```monospaziato```</code>, <code>`codice inline`</code><br/>
                      • Elenchi: <code>* item</code>, <code>- item</code>, <code>1. item</code><br/>
                      • Citazioni: <code>&gt; testo</code><br/>
                      <a href="https://faq.whatsapp.com/539178204879377/?cms_platform=web&locale=it_IT" target="_blank" rel="noopener" class="text-primary hover:underline mt-1 inline-block">Guida Ufficiale WhatsApp</a>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-on-surface-variant mb-1">{{ t('templates.preview_label') }}</label>
                <div class="w-full p-3 bg-black/20 border border-white/5 rounded-lg h-[240px] overflow-y-auto">
                  <div class="text-sm text-on-surface whitespace-pre-wrap leading-relaxed" v-html="formatWhatsAppText(formData.body)"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button @click="showWizard = false" class="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">{{ t('templates.btn_cancel') }}</button>
            <button @click="handleSave" :disabled="!formData.name || !formData.body"
                    class="px-5 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-fixed-dim transition-all disabled:opacity-30">
              {{ t('templates.btn_save') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { Plus, Edit2, Trash2, Info, Upload, Loader2 } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useTemplatesStore, type Template } from '~/stores/templates'

import { useWhatsAppFormat } from '~/composables/useWhatsAppFormat'

const { t } = useI18n()
const store = useTemplatesStore()
const { formatWhatsAppText } = useWhatsAppFormat()
const addToast = inject('addToast') as Function

const showWizard = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const isUploading = ref(false)
const uploadMode = ref<'url' | 'file'>('url')
const formData = ref({ id: '', name: '', description: '', body: '', mediaUrl: '', mediaType: 'text' })

function openWizard(tmpl?: Template) {
  if (tmpl) {
    isEditing.value = true
    formData.value = { ...tmpl, description: tmpl.description || '', mediaUrl: tmpl.mediaUrl || '', mediaType: tmpl.mediaType || 'text' }
  } else {
    isEditing.value = false
    formData.value = { id: '', name: '', description: '', body: '', mediaUrl: '', mediaType: 'text' }
  }
  uploadMode.value = (tmpl?.mediaUrl && tmpl.mediaUrl.includes('/api/media/')) ? 'file' : 'url'
  showWizard.value = true
}

async function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  isUploading.value = true
  const fd = new FormData()
  fd.append('file', file)

  try {
    const res = await $fetch<{ data: { url: string } }>('/api/upload', {
      method: 'POST',
      body: fd
    })
    formData.value.mediaUrl = res.data.url
    addToast('File caricato con successo', 'success')
  } catch (err: any) {
    addToast(err.data?.message || err.message || 'Errore durante il caricamento del file', 'error')
    target.value = '' // reset input
  } finally {
    isUploading.value = false
  }
}

async function handleSave() {
  if (!formData.value.name || !formData.value.body) return
  isSaving.value = true
  
  try {
    if (isEditing.value && formData.value.id) {
      await store.updateTemplate(formData.value.id, {
        name: formData.value.name,
        body: formData.value.body,
        description: formData.value.description,
        mediaUrl: formData.value.mediaType === 'text' ? null : formData.value.mediaUrl,
        mediaType: formData.value.mediaType
      })
      addToast('Template aggiornato con successo', 'success')
    } else {
      await store.createTemplate({
        name: formData.value.name,
        body: formData.value.body,
        description: formData.value.description,
        mediaUrl: formData.value.mediaType === 'text' ? null : formData.value.mediaUrl,
        mediaType: formData.value.mediaType
      })
      addToast('Template creato con successo', 'success')
    }
    showWizard.value = false
    await store.fetchTemplates()
  } catch (err: any) {
    addToast(err.data?.message || err.message || 'Errore durante il salvataggio del template', 'error')
  } finally {
    isSaving.value = false
  }
}

async function handleDelete(id: string) {
  if (confirm(t('templates.confirm_delete'))) {
    try {
      await store.deleteTemplate(id)
      addToast('Template eliminato con successo', 'success')
      await store.fetchTemplates()
    } catch (err: any) {
      addToast(err.data?.message || err.message || 'Errore durante l\'eliminazione', 'error')
    }
  }
}

onMounted(() => {
  store.fetchTemplates()
})
</script>
