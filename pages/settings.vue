<template>
  <div class="p-8 space-y-8 animate-fade-in">
    <h1 class="text-3xl font-bold text-on-surface tracking-tight">{{ t('nav.settings') }}</h1>

    <div class="max-w-2xl space-y-6">
      <!-- WhatsApp Engine -->
      <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <Wifi class="w-5 h-5 text-primary" /> {{ t('settings.engine_title') }}
        </h2>
        <div class="grid grid-cols-2 gap-3">
          <button v-for="eng in store.settings.supportedEngines" :key="eng"
                  @click="store.settings.whatsappEngine = eng as any"
                  class="p-4 rounded-xl border text-left transition-all"
                  :class="store.settings.whatsappEngine === eng
                    ? 'border-primary bg-primary/10 text-on-surface'
                    : 'border-white/10 bg-white/5 text-on-surface-variant hover:border-white/20'">
            <p class="font-semibold text-sm">{{ eng === 'wuzapi' ? t('settings.engine_wuzapi') : t('settings.engine_gowa') }}</p>
            <p class="text-xs mt-1 opacity-70">{{ eng === 'wuzapi' ? t('settings.engine_wuzapi_desc') : t('settings.engine_gowa_desc') }}</p>
          </button>
        </div>
      </div>

      <!-- Rate Limiting -->
      <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <Clock class="w-5 h-5 text-secondary" /> {{ t('settings.rate_title') }}
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-on-surface-variant font-medium">{{ t('settings.delay_min') }}</label>
            <input v-model.number="store.settings.delayMin" type="number" min="5" max="300"
                   class="w-full mt-1 p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors" />
          </div>
          <div>
            <label class="text-sm text-on-surface-variant font-medium">{{ t('settings.delay_max') }}</label>
            <input v-model.number="store.settings.delayMax" type="number" min="10" max="600"
                   class="w-full mt-1 p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors" />
          </div>
        </div>
        <div class="mt-4">
          <label class="text-sm text-on-surface-variant font-medium">{{ t('settings.max_per_hour') }}</label>
          <input v-model.number="store.settings.maxMessagesPerHour" type="number" min="1" max="1000"
                 class="w-full mt-1 p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors" />
        </div>
      </div>

      <!-- Anti-Ban -->
      <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <Shield class="w-5 h-5 text-tertiary" /> {{ t('settings.antiban_title') }}
        </h2>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-on-surface font-medium">{{ t('settings.antiban_label') }}</p>
            <p class="text-xs text-on-surface-variant mt-1">{{ t('settings.antiban_desc') }}</p>
          </div>
          <button @click="store.settings.spintaxEnabled = !store.settings.spintaxEnabled"
                  class="w-12 h-7 rounded-full transition-colors relative"
                  :class="store.settings.spintaxEnabled ? 'bg-primary' : 'bg-white/20'">
            <div class="w-5 h-5 bg-white rounded-full absolute top-1 transition-transform"
                 :class="store.settings.spintaxEnabled ? 'translate-x-6' : 'translate-x-1'"></div>
          </button>
        </div>
      </div>

      <!-- Brand Customization (2026 UX Trends) -->
      <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 animate-fade-in" style="transition-duration: var(--motion-duration, 300ms)">
        <h2 class="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <Palette class="w-5 h-5 text-secondary" /> Brand & UI Customization
        </h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-on-surface-variant font-medium">Primary Color</label>
            <div class="flex items-center gap-2 mt-1">
              <input type="color" v-model="store.brandSettings.primaryColor" class="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent" />
              <input type="text" v-model="store.brandSettings.primaryColor" class="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label class="text-sm text-on-surface-variant font-medium">Secondary Color</label>
            <div class="flex items-center gap-2 mt-1">
              <input type="color" v-model="store.brandSettings.secondaryColor" class="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent" />
              <input type="text" v-model="store.brandSettings.secondaryColor" class="w-full p-2 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors" />
            </div>
          </div>
          <div>
            <label class="text-sm text-on-surface-variant font-medium">Typography (Font Family)</label>
            <select v-model="store.brandSettings.fontName" class="w-full mt-1 p-2 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors">
              <option value="Inter">Inter (Default)</option>
              <option value="Roboto">Roboto</option>
              <option value="Outfit">Outfit</option>
              <option value="Space Grotesk">Space Grotesk</option>
            </select>
          </div>
          <div>
             <label class="text-sm text-on-surface-variant font-medium">Kinetic Motion Speed</label>
             <input type="range" v-model.number="store.brandSettings.motionLevel" min="0" max="100" class="w-full mt-3 accent-primary" />
             <p class="text-xs text-on-surface-variant mt-1 text-right">{{ store.brandSettings.motionLevel }}%</p>
          </div>
        </div>
        <div class="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <div>
            <p class="text-sm text-on-surface font-medium">Glassmorphism & Depth</p>
            <p class="text-xs text-on-surface-variant mt-1">Enable radical authenticity spatial layers</p>
          </div>
          <button @click="store.brandSettings.enableGlassmorphism = !store.brandSettings.enableGlassmorphism"
                  class="w-12 h-7 rounded-full transition-colors relative"
                  :class="store.brandSettings.enableGlassmorphism ? 'bg-primary' : 'bg-white/20'">
            <div class="w-5 h-5 bg-white rounded-full absolute top-1 transition-transform"
                 :class="store.brandSettings.enableGlassmorphism ? 'translate-x-6' : 'translate-x-1'"></div>
          </button>
        </div>
      </div>

      <!-- AI Integrations (LLM) -->
      <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
        <h2 class="text-lg font-semibold text-on-surface mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          Integrazioni AI (LLM & Anti-Ban)
        </h2>
        
        <!-- Diagnostica Cockpit Tools -->
        <div class="mb-6 p-4 rounded-xl border border-white/10 bg-black/20 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-bold text-on-surface flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :class="store.cockpitAvailable ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'"></span>
                API Status: Cockpit Tools
              </p>
              <p class="text-xs text-on-surface-variant mt-1">
                {{ store.cockpitAvailable ? 'Cockpit Daemon rilevato correttamente.' : 'Cockpit non rilevato sulla macchina locale.' }}
              </p>
            </div>
            <button v-if="store.cockpitAvailable" @click="store.llmSettings.useCockpit = !store.llmSettings.useCockpit"
                    class="w-12 h-7 rounded-full transition-colors relative shrink-0"
                    :class="store.llmSettings.useCockpit ? 'bg-primary' : 'bg-white/20'">
              <div class="w-5 h-5 bg-white rounded-full absolute top-1 transition-transform"
                   :class="store.llmSettings.useCockpit ? 'translate-x-6' : 'translate-x-1'"></div>
            </button>
          </div>

          <div v-if="!store.cockpitAvailable" class="bg-red-500/10 border border-red-500/20 p-3 rounded-lg">
            <p class="text-xs text-red-200">Per utilizzare Cockpit Tools come proxy LLM, assicurati che il demone sia in esecuzione e che il file `~/.antigravity_cockpit/accounts.json` sia accessibile.</p>
          </div>

          <div v-else>
            <p class="text-xs font-medium text-on-surface-variant mb-2">Account Cockpit Disponibili ({{ store.cockpitAccounts.length }}):</p>
            <ul class="space-y-1 mb-3">
              <li v-for="acc in store.cockpitAccounts" :key="acc.id" class="text-xs text-primary/80 bg-primary/5 px-2 py-1 rounded inline-block mr-2 border border-primary/20">
                {{ acc.email }}
              </li>
            </ul>
            
            <div v-if="store.llmSettings.useCockpit">
              <label class="text-xs text-on-surface-variant font-medium">Seleziona Account Attivo per WaForge</label>
              <select v-model="store.llmSettings.cockpitAccount" class="w-full mt-1 p-2 bg-black/40 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors">
                <option value="">Seleziona account...</option>
                <option v-for="acc in store.cockpitAccounts" :key="acc.id" :value="acc.email">{{ acc.email }}</option>
              </select>
            </div>
          </div>
        </div>

        <div v-else class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-on-surface-variant font-medium">Provider LLM</label>
              <select v-model="store.llmSettings.provider" class="w-full mt-1 p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors">
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
                <option value="cohere">Cohere</option>
                <option value="custom">Custom (Locale / LM Studio)</option>
              </select>
            </div>
            <div>
              <label class="text-sm text-on-surface-variant font-medium">Modello</label>
              <input v-model="store.llmSettings.model" type="text" placeholder="es. gpt-4o-mini"
                     class="w-full mt-1 p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors" />
            </div>
          </div>
          <div v-if="store.llmSettings.provider === 'custom'">
            <label class="text-sm text-on-surface-variant font-medium">Base URL (per LM Studio / Ollama)</label>
            <input v-model="store.llmSettings.customBaseUrl" type="text" placeholder="http://127.0.0.1:1234/v1"
                   class="w-full mt-1 p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors" />
          </div>
          <div>
            <label class="text-sm text-on-surface-variant font-medium">API Key <span v-if="store.llmSettings.provider === 'custom'" class="text-white/30">(Opzionale)</span></label>
            <input v-model="store.llmSettings.apiKey" type="password" placeholder="sk-..."
                   class="w-full mt-1 p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors" />
          </div>
          <div>
            <label class="text-sm text-on-surface-variant font-medium flex items-center justify-between">
              Server MCP (Model Context Protocol)
              <button @click="store.llmSettings.mcpServers.push('')" class="text-xs text-primary hover:text-primary-fixed-dim">+ Aggiungi</button>
            </label>
            <div class="space-y-2 mt-2">
              <div v-for="(server, idx) in store.llmSettings.mcpServers" :key="idx" class="flex gap-2">
                <input v-model="store.llmSettings.mcpServers[idx]" type="text" placeholder="es. npx -y @modelcontextprotocol/server-everything"
                       class="flex-1 p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors" />
                <button @click="store.llmSettings.mcpServers.splice(idx, 1)" class="p-3 text-red-400 hover:text-red-300 bg-white/5 rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
              <p v-if="!store.llmSettings.mcpServers?.length" class="text-xs text-on-surface-variant">Nessun server MCP configurato. Clicca "+ Aggiungi" per collegare strumenti esterni all'LLM.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Save -->
      <div class="flex items-center gap-4">
        <button @click="handleSave" :disabled="store.loading"
                class="px-6 py-3 bg-primary text-on-primary font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)] transition-all disabled:opacity-50">
          {{ store.loading ? t('settings.btn_saving') : t('settings.btn_save') }}
        </button>
        <span v-if="store.saved" class="text-sm text-primary font-medium animate-fade-in">{{ t('settings.saved') }}</span>
        <span v-if="error" class="text-sm text-error font-medium animate-fade-in">{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Wifi, Clock, Shield, Palette } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useSettingsStore } from '~/stores/settings'

const { t } = useI18n()
const store = useSettingsStore()
const error = ref('')

async function handleSave() {
  error.value = ''
  if (store.settings.delayMin >= store.settings.delayMax) {
    error.value = 'Il ritardo minimo deve essere minore del ritardo massimo.'
    return
  }
  await store.saveSettings()
}

onMounted(() => store.fetchSettings())
</script>
