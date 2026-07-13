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
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-sm font-medium text-on-surface-variant">{{ t('templates.body_label') }}</label>
                  <button @click="showAiAssistant = true" class="text-xs flex items-center gap-1 text-primary hover:text-primary-fixed-dim transition-colors">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Assistente AI (Anti-Ban)
                  </button>
                </div>
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
                      <strong class="text-on-surface">Spintax supportato:</strong> <code>{Ciao|Salve}</code> verrà scelto a caso ad ogni invio.<br/><br/>
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
                <div class="flex items-center justify-between mb-1">
                  <label class="block text-sm font-medium text-on-surface-variant">{{ t('templates.preview_label') }}</label>
                  <button v-if="formData.body" @click="spintaxPreviewTrigger++" class="text-[11px] text-primary hover:text-primary-fixed-dim transition-colors flex items-center gap-1">
                    🎲 Anteprima Spintax
                  </button>
                </div>
                <div class="w-full p-3 bg-black/20 border border-white/5 rounded-lg h-[240px] overflow-y-auto">
                  <div class="text-sm text-on-surface whitespace-pre-wrap leading-relaxed" v-html="spintaxPreview"></div>
                </div>
                <p v-if="spintaxVariationCount > 1" class="text-[11px] text-on-surface-variant mt-1 text-right">🔄 {{ spintaxVariationCount.toLocaleString() }} varianti possibili</p>
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

    <!-- AI Assistant Modal -->
    <Teleport to="body">
      <div v-if="showAiAssistant" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showAiAssistant = false">
        <div class="w-full max-w-3xl bg-surface-container-high border border-primary/30 rounded-2xl p-8 shadow-[0_0_40px_rgba(37,211,102,0.2)] flex flex-col h-[700px] animate-slide-in">
          <h3 class="text-xl font-bold text-on-surface mb-2 flex items-center gap-2 shrink-0">
            <Sparkles class="w-6 h-6 text-primary" />
            Assistente AI
          </h3>
          <p class="text-sm text-on-surface-variant mb-5 shrink-0">Usa l'intelligenza artificiale per conversare, migliorare il tuo messaggio o applicare tecniche Anti-Ban.</p>

          <div class="grid grid-cols-2 gap-4 mb-4 shrink-0 bg-black/30 p-4 rounded-xl border border-white/5">
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Modello AI</label>
              <select v-model="aiModelOverride" class="w-full p-2.5 bg-surface border border-white/10 rounded-lg text-on-surface text-sm outline-none focus:border-primary transition-colors">
                <option value="">⚙️ {{ defaultModelLabel }}</option>
                <optgroup v-for="group in aiModelGroups" :key="group.category" :label="`${group.icon} ${group.label}`">
                  <option v-for="m in group.models" :key="m.id" :value="m.id">{{ m.name }} ({{ m.provider }})</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant mb-1.5 uppercase tracking-wider">Tipo di Ragionamento</label>
              <select v-model="aiReasoningMode" class="w-full p-2.5 bg-surface border border-white/10 rounded-lg text-on-surface text-sm outline-none focus:border-primary transition-colors">
                <option value="standard">🎯 Standard / Copywriter</option>
                <option value="creative">✨ Creativo & Coinvolgente</option>
                <option value="analytical">📊 Analitico / Spintax Deep</option>
                <option value="antiban">🛡️ Anti-Ban & Stealth Max</option>
                <option value="cot">🧠 Ragionamento Logico (CoT)</option>
              </select>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin">
            <div class="bg-black/20 p-4 rounded-xl border border-white/5 w-11/12 text-sm text-on-surface-variant leading-relaxed">
              Ciao! 👋 Posso aiutarti a migliorare il messaggio o a renderlo a prova di ban. Seleziona un'azione rapida o scrivimi cosa vuoi fare.
            </div>
            
            <div v-for="(msg, i) in chatHistory" :key="i" 
                 :class="msg.role === 'user' ? 'bg-primary/10 border-primary/20 ml-auto' : 'bg-black/20 border-white/5 mr-auto'"
                 class="p-4 rounded-xl border w-11/12 whitespace-pre-wrap">
              <span v-if="msg.role === 'user'" class="text-primary font-semibold block mb-2 text-xs uppercase tracking-wider">Tu</span>
              <span v-else class="text-secondary font-semibold block mb-2 text-xs uppercase tracking-wider">Assistente</span>
              <div v-if="msg.role === 'assistant'" class="text-sm text-on-surface leading-relaxed" v-html="formatWhatsAppText(msg.content)"></div>
              <span v-else class="text-sm text-on-surface leading-relaxed">{{ msg.content }}</span>
              <button v-if="msg.role === 'assistant' && isAiReadyContent(msg.content)" 
                      @click="formData.body = msg.content; showAiAssistant = false" 
                      class="mt-3 text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/30 transition-colors font-medium flex items-center gap-1.5">
                ✅ Usa questo testo
              </button>
            </div>
            <div v-if="isGeneratingAi" class="bg-black/20 p-4 rounded-xl border border-white/5 w-11/12 mr-auto flex items-center gap-3">
              <Loader2 class="w-5 h-5 animate-spin text-primary" />
              <span class="text-sm text-on-surface-variant">Elaborazione in corso...</span>
            </div>
          </div>

          <div class="space-y-3 shrink-0">
            <div class="flex gap-3">
              <button @click="handleAiGenerate('improve')" :disabled="isGeneratingAi || !formData.body"
                      class="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface text-sm font-medium rounded-xl transition-colors border border-white/5">
                ✨ Migliora Formattazione
              </button>
              <button @click="handleAiGenerate('antiban')" :disabled="isGeneratingAi || !formData.body"
                      class="flex-1 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium rounded-xl transition-colors border border-primary/20">
                🛡️ Applica Anti-Ban
              </button>
            </div>
            <div class="flex gap-3 relative">
              <input v-model="aiPrompt" type="text" placeholder="Chiedi all'IA..." @keyup.enter="handleAiGenerate('chat')"
                     class="flex-1 p-3.5 bg-black/30 border border-white/10 rounded-xl text-on-surface text-sm focus:border-primary outline-none" />
              <button @click="handleAiGenerate('chat')" :disabled="isGeneratingAi || !aiPrompt"
                      class="px-5 bg-primary text-on-primary rounded-xl hover:bg-primary-fixed-dim transition-colors disabled:opacity-50 flex items-center justify-center">
                <Send class="w-5 h-5" />
              </button>
            </div>
          </div>
          
          <div class="flex justify-end gap-3 mt-5 shrink-0">
            <button @click="showAiAssistant = false" class="px-5 py-2.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors rounded-lg hover:bg-white/5">Chiudi</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { Plus, Edit2, Trash2, Info, Upload, Loader2, Sparkles, Send } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useTemplatesStore, type Template } from '~/stores/templates'
import { useSettingsStore } from '~/stores/settings'
import { LLM_MODELS, getModelsGroupedByCategory } from '~/lib/llm-models'
import { countVariations } from '~/lib/spintax'

import { useWhatsAppFormat } from '~/composables/useWhatsAppFormat'

const { t } = useI18n()
const store = useTemplatesStore()
const settingsStore = useSettingsStore()
const { formatWhatsAppText, renderSpintax } = useWhatsAppFormat()
const addToast = inject('addToast') as Function

// Spintax preview for template body
const spintaxPreviewTrigger = ref(0)
const spintaxPreview = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  spintaxPreviewTrigger.value // Track dependency for re-randomization
  return formatWhatsAppText(renderSpintax(formData.value.body))
})
const spintaxVariationCount = computed(() => countVariations(formData.value.body))

// AI model groups from settings store dynamic catalog
const aiModelGroups = computed(() => {
  const provider = settingsStore.llmSettings.useCockpit ? 'all' : (settingsStore.llmSettings.provider || 'openai')
  return getModelsGroupedByCategory(provider, settingsStore.dynamicModels.length ? settingsStore.dynamicModels : undefined)
})

// Label for default model showing what's actually configured
const defaultModelLabel = computed(() => {
  const model = settingsStore.llmSettings.model
  if (!model || model === 'gpt-4o-mini') return 'Predefinito (GPT-4o Mini)'
  const found = LLM_MODELS.find(m => m.id === model)
  return found ? `Predefinito (${found.name})` : `Predefinito (${model})`
})

// Check if an AI message is actual content (not progress/error)
function isAiReadyContent(content: string): boolean {
  if (!content) return false
  if (content.startsWith('⏳') || content.includes('⏳')) return false
  if (content.startsWith('❌') || content.includes('❌')) return false
  if (content.includes('Inizializzazione...') || content.includes('Elaborazione in corso') || content.includes('Attesa di risposta')) return false
  if (content.trim().length < 15 && (content.includes('...') || content.startsWith('ℹ️'))) return false
  return true
}

const showWizard = ref(false)
const isEditing = ref(false)
const isSaving = ref(false)
const isUploading = ref(false)
const uploadMode = ref<'url' | 'file'>('url')
const formData = ref({ id: '', name: '', description: '', body: '', mediaUrl: '', mediaType: 'text' })

const showAiAssistant = ref(false)
const aiPrompt = ref('')
const aiModelOverride = ref('')
const aiReasoningMode = ref('standard')
const isGeneratingAi = ref(false)
const chatHistory = ref<{role: string, content: string}[]>([])

async function handleAiGenerate(action: 'custom' | 'antiban' | 'improve' | 'chat') {
  if (action === 'chat' && aiPrompt.value) {
    chatHistory.value.push({ role: 'user', content: aiPrompt.value })
  }
  isGeneratingAi.value = true
  try {
    const historyToSend = [...chatHistory.value]
    if (action !== 'chat') {
      historyToSend.push({ role: 'user', content: action === 'antiban' ? 'Applica Anti-Ban al testo attuale.' : 'Migliora la formattazione del testo attuale.' })
    }

    const response = await fetch('/api/llm/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: action === 'chat' ? aiPrompt.value : undefined,
        originalMessage: formData.value.body,
        action,
        chatHistory: historyToSend,
        modelOverride: aiModelOverride.value || undefined,
        reasoningMode: aiReasoningMode.value
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    if (!response.body) throw new Error('No response body')

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    
    // Aggiungi subito il placeholder per la risposta
    if (action !== 'chat') {
      chatHistory.value.push({ role: 'user', content: action === 'antiban' ? 'Applica Anti-Ban al testo attuale.' : 'Migliora la formattazione del testo attuale.' })
    }
    chatHistory.value.push({ role: 'assistant', content: 'Inizializzazione...' })
    const assistantMsgIdx = chatHistory.value.length - 1

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          let data: any = null
          try {
            data = JSON.parse(line.slice(6))
          } catch (e) {
            console.error('Error parsing SSE:', e)
          }
          if (data) {
            if (data.type === 'progress') {
              chatHistory.value[assistantMsgIdx].content = `⏳ ${data.msg}`
            } else if (data.type === 'complete') {
              chatHistory.value[assistantMsgIdx].content = data.result
              if (action === 'chat') {
                aiPrompt.value = ''
              }
            } else if (data.type === 'error') {
              chatHistory.value[assistantMsgIdx].content = `❌ Errore AI: ${data.error}`
              throw new Error(data.error)
            }
          }
        }
      }
    }
  } catch (err: any) {
    if (chatHistory.value.length > 0 && chatHistory.value[chatHistory.value.length - 1].role === 'assistant') {
      const lastMsg = chatHistory.value[chatHistory.value.length - 1].content
      if (lastMsg.startsWith('⏳') || lastMsg === 'Inizializzazione...') {
        chatHistory.value[chatHistory.value.length - 1].content = `❌ Errore: ${err.message || 'Errore Stream'}`
      }
    } else {
      alert(t('common.error') + ': ' + (err.message || 'Errore Stream'))
    }
  } finally {
    isGeneratingAi.value = false
  }
}

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
