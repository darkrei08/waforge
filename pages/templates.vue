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

    <!-- Create/Edit Unified Split-Screen Modal (OpenAI / Claude Web Style) -->
    <Teleport to="body">
      <div v-if="showWizard" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-4 md:p-6" @click.self="showWizard = false">
        <div class="w-full max-w-[1360px] h-[92vh] max-h-[880px] bg-[#111318]/95 border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-slide-in">
          
          <!-- Modal Header -->
          <div class="px-6 py-4 border-b border-white/10 bg-[#16181f]/90 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3.5">
              <div class="w-10 h-10 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shadow-[0_0_15px_rgba(37,211,102,0.2)]">
                <Sparkles class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-base sm:text-lg font-bold text-on-surface tracking-tight flex items-center gap-2.5">
                  {{ isEditing ? t('templates.edit_title') : t('templates.create_title') }}
                  <span class="px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold uppercase tracking-wider">AI Co-Pilot Integrato</span>
                </h3>
                <p class="text-xs text-on-surface-variant hidden sm:block">Editor unificato side-by-side con assistenza AI in tempo reale, protezione Anti-Ban e Anteprima Spintax.</p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <button @click="showAiPanel = !showAiPanel"
                      class="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all border"
                      :class="showAiPanel ? 'bg-primary/15 text-primary border-primary/30 shadow-[0_0_15px_rgba(37,211,102,0.15)]' : 'bg-white/5 text-on-surface-variant border-white/10 hover:text-on-surface'">
                <Sparkles class="w-3.5 h-3.5" />
                <span>{{ showAiPanel ? '💬 Nascondi AI Co-Pilot' : '💬 Apri AI Co-Pilot' }}</span>
              </button>
              <button @click="showWizard = false" class="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-xl transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
          </div>

          <!-- Split Workspace Grid -->
          <div class="flex-1 flex overflow-hidden relative">
            
            <!-- LEFT PANE: Template Editor & Preview -->
            <div class="flex-1 flex flex-col p-6 overflow-y-auto space-y-5 scrollbar-thin" :class="showAiPanel ? 'border-r border-white/10' : ''">
              <!-- Name & Description -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">{{ t('templates.name_label') }} *</label>
                  <input v-model="formData.name" type="text" :placeholder="t('templates.name_placeholder')"
                         class="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-on-surface text-sm focus:border-primary/60 outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5">{{ t('templates.description_label') }}</label>
                  <input v-model="formData.description" type="text" :placeholder="t('templates.description_placeholder')"
                         class="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-on-surface text-sm focus:border-primary/60 outline-none transition-colors" />
                </div>
              </div>

              <!-- Media Upload / URL -->
              <div class="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-3 shrink-0">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Tipo Media (Opzionale)</label>
                  <div v-if="formData.mediaType !== 'text'" class="flex items-center gap-2 text-xs">
                    <button @click="uploadMode = 'url'" :class="uploadMode === 'url' ? 'text-primary font-semibold' : 'text-on-surface-variant'" class="hover:text-primary transition-colors">🌐 URL Link</button>
                    <span class="text-white/20">|</span>
                    <button @click="uploadMode = 'file'" :class="uploadMode === 'file' ? 'text-primary font-semibold' : 'text-on-surface-variant'" class="hover:text-primary transition-colors">📁 Carica File</button>
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <select v-model="formData.mediaType" class="p-3 bg-black/40 border border-white/10 rounded-xl text-on-surface text-sm focus:border-primary/60 outline-none">
                    <option value="text">📄 Nessun Media (Solo Testo)</option>
                    <option value="image">🖼️ Immagine</option>
                    <option value="video">🎥 Video</option>
                    <option value="document">📎 Documento</option>
                    <option value="audio">🎵 Audio</option>
                  </select>

                  <div v-if="formData.mediaType !== 'text'" class="sm:col-span-2">
                    <div v-if="uploadMode === 'url'">
                      <input v-model="formData.mediaUrl" type="url" placeholder="https://esempio.com/file.jpg"
                             class="w-full p-3 bg-black/40 border border-white/10 rounded-xl text-on-surface text-sm focus:border-primary/60 outline-none" />
                    </div>
                    <div v-else>
                      <label class="relative flex items-center justify-center w-full p-3 bg-black/40 border border-dashed border-white/20 hover:border-primary/50 rounded-xl cursor-pointer transition-colors" :class="{ 'opacity-50 pointer-events-none': isUploading }">
                        <input type="file" class="hidden" @change="handleFileUpload" accept="image/*,video/*,audio/*,.pdf,.doc,.docx" />
                        <div class="flex items-center gap-2 text-sm text-on-surface-variant">
                          <Loader2 v-if="isUploading" class="w-4 h-4 animate-spin text-primary" />
                          <Upload v-else class="w-4 h-4 text-primary" />
                          <span v-if="isUploading">Caricamento in corso...</span>
                          <span v-else-if="formData.mediaUrl" class="text-primary truncate max-w-[220px] font-medium">File: {{ formData.mediaUrl.split('/').pop() }}</span>
                          <span v-else>Clicca o trascina un file per caricarlo (Max 5MB)</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Message Body & Live Preview Grid -->
              <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 flex-1 min-h-[300px]">
                <!-- Editor Box -->
                <div class="flex flex-col h-full">
                  <div class="flex items-center justify-between mb-1.5 shrink-0">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{{ t('templates.body_label') }} *</label>
                    <div class="flex items-center gap-2 text-[11px] text-on-surface-variant">
                      <span v-if="formData.body">{{ formData.body.length }} caratteri</span>
                      <button v-if="!showAiPanel" @click="showAiPanel = true" class="text-primary hover:underline font-semibold flex items-center gap-1">
                        <Sparkles class="w-3 h-3" /> Apri Co-Pilot AI
                      </button>
                    </div>
                  </div>
                  <textarea v-model="formData.body" rows="8" :placeholder="t('templates.body_placeholder')"
                            class="w-full flex-1 p-4 bg-black/40 border border-white/10 rounded-2xl text-on-surface text-sm focus:border-primary/60 outline-none whitespace-pre-wrap font-sans leading-relaxed resize-none scrollbar-thin"></textarea>
                  
                  <!-- Formattazione Legenda espandibile / compatta -->
                  <WhatsAppFormattingLegend />
                </div>

                <!-- Live Preview Box -->
                <div class="flex flex-col h-full">
                  <div class="flex items-center justify-between mb-1.5 shrink-0">
                    <label class="block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{{ t('templates.preview_label') }} (WhatsApp Live)</label>
                    <button v-if="formData.body" @click="spintaxPreviewTrigger++" class="text-xs text-primary hover:text-primary-fixed-dim font-medium transition-colors flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                      🎲 Rigenera Spintax
                    </button>
                  </div>
                  <div class="flex-1 p-4 bg-[#0a0c10]/80 border border-white/10 rounded-2xl overflow-y-auto scrollbar-thin flex flex-col justify-between">
                    <div v-if="formData.body" class="text-sm text-on-surface whitespace-pre-wrap leading-relaxed select-text" v-html="spintaxPreview"></div>
                    <div v-else class="text-xs text-on-surface-variant/40 italic flex items-center justify-center h-full">
                      Inizia a digitare o chiedi all'AI Co-Pilot per vedere l'anteprima in tempo reale...
                    </div>
                    
                    <div v-if="formData.body && spintaxVariationCount > 1" class="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-on-surface-variant/70 shrink-0">
                      <span>⚡ Protezione Anti-Ban attiva</span>
                      <span class="font-semibold text-secondary">🔄 {{ spintaxVariationCount.toLocaleString() }} combinazioni uniche possibili</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer Buttons inside Left Pane -->
              <div class="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
                <span class="text-xs text-on-surface-variant">I template con Spintax riducono del 94% il rischio di segnalazione spam.</span>
                <div class="flex gap-3">
                  <button @click="showWizard = false" class="px-5 py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-surface transition-colors rounded-xl hover:bg-white/5">{{ t('templates.btn_cancel') }}</button>
                  <button @click="handleSave" :disabled="!formData.name || !formData.body || isSaving"
                          class="px-6 py-2.5 bg-primary text-on-primary font-bold text-sm rounded-xl hover:bg-primary-fixed-dim hover:shadow-[0_0_20px_rgba(37,211,102,0.4)] transition-all disabled:opacity-30 flex items-center gap-2">
                    <Loader2 v-if="isSaving" class="w-4 h-4 animate-spin" />
                    <span>{{ t('templates.btn_save') }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- RIGHT PANE: OpenAI / Claude Web UI AI Co-Pilot -->
            <div v-if="showAiPanel" class="w-[450px] xl:w-[490px] flex-shrink-0 flex flex-col bg-[#0e1014]/95 border-l border-white/10 overflow-hidden transition-all duration-300 animate-fade-in">
              <!-- Co-Pilot Subheader -->
              <div class="p-4 border-b border-white/10 bg-[#14161d]/90 flex flex-col gap-3 shrink-0">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-on-surface tracking-wider uppercase flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                    AI Copywriter & Anti-Ban Co-Pilot
                  </span>
                  <div class="flex items-center gap-1.5">
                    <select v-model="aiModelOverride" class="text-xs py-1 px-2 bg-black/40 border border-white/10 rounded-lg text-on-surface outline-none focus:border-primary/50">
                      <option value="">⚙️ {{ defaultModelLabel }}</option>
                      <optgroup v-for="group in aiModelGroups" :key="group.category" :label="`${group.icon} ${group.label}`">
                        <option v-for="m in group.models" :key="m.id" :value="m.id">{{ m.name }}</option>
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <select v-model="aiReasoningMode" class="w-full text-xs py-1.5 px-2.5 bg-black/40 border border-white/10 rounded-lg text-on-surface outline-none focus:border-primary/50">
                    <option value="standard">🎯 Standard / Copywriter</option>
                    <option value="creative">✨ Creativo & Coinvolgente</option>
                    <option value="analytical">📊 Analitico / Spintax Deep</option>
                    <option value="antiban">🛡️ Anti-Ban & Stealth Max</option>
                    <option value="cot">🧠 Ragionamento Logico (CoT)</option>
                  </select>
                </div>
              </div>

              <!-- Chat Messages Feed -->
              <div class="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                <div class="bg-[#181b24]/80 p-4 rounded-2xl border border-white/5 text-sm text-on-surface-variant leading-relaxed shadow-sm">
                  <div class="flex items-center gap-2 font-bold text-on-surface mb-2">
                    <Sparkles class="w-4 h-4 text-primary" />
                    <span>Come posso aiutarti?</span>
                  </div>
                  <p class="text-xs leading-relaxed mb-3">Chiedimi di scrivere un messaggio da zero, riscrivere il testo attuale o convertire le frasi in combinazioni Spintax anti-blocco.</p>
                  
                  <div class="space-y-1.5">
                    <button @click="quickAiPrompt('Rendi il testo attuale più professionale e persuasivo con formattazione WhatsApp chiaro')" class="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] text-on-surface transition-colors flex items-center justify-between border border-white/5">
                      <span>👔 Rendi il testo più professionale</span>
                      <span class="text-white/40">→</span>
                    </button>
                    <button @click="quickAiPrompt('Aggiungi variazioni Spintax { | } a saluti, verbi e chiusure per evitare il ban')" class="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] text-on-surface transition-colors flex items-center justify-between border border-white/5">
                      <span>🎲 Arricchisci con Spintax anti-ban</span>
                      <span class="text-white/40">→</span>
                    </button>
                    <button @click="quickAiPrompt('Scrivi un messaggio promozionale accattivante con call to action e variabili {{Name}}')" class="w-full text-left p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[11px] text-on-surface transition-colors flex items-center justify-between border border-white/5">
                      <span>🚀 Crea messaggio promozionale da zero</span>
                      <span class="text-white/40">→</span>
                    </button>
                  </div>
                </div>

                <!-- Chat History Feed -->
                <div v-for="(msg, i) in chatHistory" :key="i" 
                     class="flex flex-col animate-fade-in"
                     :class="msg.role === 'user' ? 'items-end ml-8' : 'items-start mr-4'">
                  
                  <span class="text-[10px] uppercase font-bold tracking-wider mb-1 px-1"
                        :class="msg.role === 'user' ? 'text-primary' : 'text-secondary flex items-center gap-1'">
                    <Sparkles v-if="msg.role === 'assistant'" class="w-3 h-3" />
                    {{ msg.role === 'user' ? 'Tu' : 'AI Co-Pilot' }}
                  </span>

                  <div class="p-3.5 rounded-2xl text-sm w-full border whitespace-pre-wrap leading-relaxed shadow-md"
                       :class="msg.role === 'user' 
                         ? 'bg-primary/15 border-primary/30 text-on-surface rounded-tr-sm' 
                         : 'bg-[#1b1f2b]/90 border-white/10 text-on-surface rounded-tl-sm'">
                    <div v-if="msg.role === 'assistant'" v-html="formatWhatsAppText(msg.content)"></div>
                    <div v-else>{{ msg.content }}</div>
                  </div>

                  <!-- Assistant Action Pills (Apply & Copy) -->
                  <div v-if="msg.role === 'assistant' && isAiReadyContent(msg.content, i)" class="flex items-center gap-2 mt-2 ml-1">
                    <button @click="applyToBody(msg.content)" 
                            class="text-xs bg-primary text-on-primary font-bold px-3 py-1.5 rounded-xl hover:bg-primary-fixed-dim hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] transition-all flex items-center gap-1.5 shadow-sm">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                      <span>⚡ Applica al Template</span>
                    </button>
                    <button @click="copyToClipboard(msg.content)" 
                            class="text-xs bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface px-2.5 py-1.5 rounded-xl transition-colors border border-white/10 flex items-center gap-1">
                      <span>📋 Copia</span>
                    </button>
                  </div>
                </div>

                <!-- Generating Indicator -->
                <div v-if="isGeneratingAi" class="bg-[#1b1f2b]/90 p-3.5 rounded-2xl border border-white/10 w-4/5 flex items-center gap-3 animate-pulse">
                  <Loader2 class="w-5 h-5 animate-spin text-primary shrink-0" />
                  <span class="text-xs text-on-surface font-medium">Elaborazione in corso...</span>
                </div>
              </div>

              <!-- Action Bar (Improve / Anti-Ban quick triggers) -->
              <div class="px-4 py-2 border-t border-white/5 bg-[#14161d]/80 grid grid-cols-2 gap-2 shrink-0">
                <button @click="handleAiGenerate('improve')" :disabled="isGeneratingAi || !formData.body"
                        class="py-2 px-3 bg-white/5 hover:bg-white/10 text-on-surface-variant hover:text-on-surface text-xs font-semibold rounded-xl transition-all border border-white/5 flex items-center justify-center gap-1.5 disabled:opacity-30">
                  <span>✨ Migliora Formattazione</span>
                </button>
                <button @click="handleAiGenerate('antiban')" :disabled="isGeneratingAi || !formData.body"
                        class="py-2 px-3 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold rounded-xl transition-all border border-primary/20 flex items-center justify-center gap-1.5 disabled:opacity-30">
                  <span>🛡️ Applica Anti-Ban</span>
                </button>
              </div>

              <!-- Input Capsule (ChatGPT / Claude Web Style) -->
              <div class="p-4 bg-[#111318] border-t border-white/10 shrink-0">
                <form @submit.prevent="handleAiGenerate('chat')" class="relative flex items-center">
                  <input v-model="aiPrompt" type="text" placeholder="Chiedi all'IA..." 
                         :disabled="isGeneratingAi"
                         class="w-full bg-[#1c1e28] border border-white/15 focus:border-primary/60 rounded-full py-3 pl-4 pr-12 text-sm text-on-surface outline-none transition-all placeholder:text-on-surface-variant/40" />
                  <button type="submit" :disabled="isGeneratingAi || !aiPrompt.trim()"
                          class="absolute right-1.5 w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center hover:bg-primary-fixed-dim hover:shadow-[0_0_15px_rgba(37,211,102,0.5)] transition-all disabled:opacity-20 disabled:hover:shadow-none">
                    <Send class="w-4 h-4" />
                  </button>
                </form>
                <div class="flex items-center justify-between mt-2 px-2 text-[10px] text-on-surface-variant/60">
                  <span>Premere Invio per inviare</span>
                  <button v-if="chatHistory.length > 0" @click="chatHistory = []" type="button" class="hover:text-red-400 transition-colors">🗑️ Pulisci chat</button>
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

// Check if an AI message is actual content (not progress/error or welcome greeting)
function isAiReadyContent(content: string, idx?: number): boolean {
  if (!content) return false
  if (idx === 0) return false
  if (content.includes('👋 Ciao! Sono il tuo AI Co-Pilot') || content.includes('Scrivimi come vuoi modificare o potenziare')) return false
  if (!chatHistory.value.some(m => m.role === 'user')) return false
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
const showAiPanel = ref(true)
const aiPrompt = ref('')
const aiModelOverride = ref('')
const aiReasoningMode = ref('standard')
const isGeneratingAi = ref(false)
const chatHistory = ref<{role: string, content: string}[]>([])

function quickAiPrompt(prompt: string) {
  aiPrompt.value = prompt
  handleAiGenerate('chat')
}

function applyToBody(content: string) {
  formData.value.body = content
  spintaxPreviewTrigger.value++
  if (typeof addToast === 'function') {
    addToast('Testo applicato al template!', 'success')
  } else {
    alert('✅ Testo applicato al template con successo!')
  }
}

function copyToClipboard(content: string) {
  navigator.clipboard.writeText(content)
  if (typeof addToast === 'function') {
    addToast('Copiato negli appunti', 'success')
  } else {
    alert('📋 Copiato negli appunti!')
  }
}

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
      const errText = await response.text()
      throw new Error(errText || 'Errore nella richiesta LLM')
    }

    if (!response.body) throw new Error('Nessuna risposta dal server LLM')

    let assistantMsgIdx = chatHistory.value.length
    if (action !== 'chat' || aiPrompt.value) {
      chatHistory.value.push({ role: 'assistant', content: '⏳ Connessione al modello in corso...' })
      assistantMsgIdx = chatHistory.value.length - 1
    }
    if (action === 'chat') {
      aiPrompt.value = ''
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let isFirstChunk = true

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n')
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const dataStr = line.replace('data: ', '').trim()
        if (!dataStr || dataStr === '[DONE]') continue
        try {
          const data = JSON.parse(dataStr)
          if (data.type === 'chunk' && data.text) {
            if (isFirstChunk) {
              chatHistory.value[assistantMsgIdx].content = data.text
              isFirstChunk = false
            } else {
              chatHistory.value[assistantMsgIdx].content += data.text
            }
          } else if (data.type === 'complete' && data.result) {
            if (isFirstChunk) {
              chatHistory.value[assistantMsgIdx].content = data.result
              isFirstChunk = false
            }
          } else if (data.type === 'error' && data.message) {
            chatHistory.value[assistantMsgIdx].content = `❌ Errore: ${data.message}`
          }
        } catch (e) {
          // ignora
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
  showAiPanel.value = true
  if (chatHistory.value.length === 0) {
    chatHistory.value = [
      {
        role: 'assistant',
        content: '👋 Ciao! Sono il tuo AI Co-Pilot per WhatsApp Marketing & Anti-Ban.\nScrivimi come vuoi modificare o potenziare questo template, oppure usa i pulsanti rapidi qui sotto.'
      }
    ]
  }
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
    if (file.type.startsWith('image/')) formData.value.mediaType = 'image'
    else if (file.type.startsWith('video/')) formData.value.mediaType = 'video'
    else if (file.type.startsWith('audio/')) formData.value.mediaType = 'audio'
    else formData.value.mediaType = 'document'
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
  
  if (formData.value.mediaUrl && formData.value.mediaType === 'text') {
    const ext = formData.value.mediaUrl.split('.').pop()?.toLowerCase() || ''
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) formData.value.mediaType = 'image'
    else if (['mp4','mov','avi','webm'].includes(ext)) formData.value.mediaType = 'video'
    else if (['mp3','ogg','wav'].includes(ext)) formData.value.mediaType = 'audio'
    else if (['pdf','doc','docx','xls','xlsx','zip'].includes(ext)) formData.value.mediaType = 'document'
  }

  try {
    if (isEditing.value && formData.value.id) {
      await store.updateTemplate(formData.value.id, {
        name: formData.value.name,
        body: formData.value.body,
        description: formData.value.description,
        mediaUrl: formData.value.mediaUrl || null,
        mediaType: formData.value.mediaType
      })
      addToast('Template aggiornato con successo', 'success')
    } else {
      await store.createTemplate({
        name: formData.value.name,
        body: formData.value.body,
        description: formData.value.description,
        mediaUrl: formData.value.mediaUrl || null,
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
