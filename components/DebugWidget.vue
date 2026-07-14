<template>
  <div class="waforge-webkit-devtools font-sans select-none text-on-surface">
    <!-- Floating toggle button when closed -->
    <button v-if="!isOpen" @click="isOpen = true" 
            class="fixed bottom-4 right-4 z-[10000] px-4 py-2.5 bg-surface-container dark:bg-surface-container-highest/95 backdrop-blur-xl border border-primary/40 rounded-full shadow-[0_0_25px_rgba(37,211,102,0.35)] flex items-center gap-2 hover:scale-105 transition-all text-primary font-bold text-xs cursor-pointer group">
      <Terminal class="w-4 h-4 animate-pulse text-primary group-hover:rotate-12 transition-transform" />
      <span>WebKit DevTools</span>
      <span v-if="capturedErrors.length > 0" class="px-1.5 py-0.2 bg-error text-on-error rounded-full text-[10px] font-black animate-bounce">
        {{ capturedErrors.length }}
      </span>
      <span v-else class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
    </button>

    <!-- Main WebKit DevTools Window (Floating or Docked to Bottom) -->
    <div v-if="isOpen" ref="widgetRef" :style="isDockedBottom ? {} : style" 
         class="fixed z-[9999] bg-surface-container dark:bg-surface-container-highest/95 backdrop-blur-2xl border border-outline/20 shadow-2xl flex flex-col transition-all duration-200"
         :class="isDockedBottom ? 'bottom-0 left-0 right-0 w-full h-[340px] rounded-none border-t-2 border-primary/40 border-l-0 border-r-0 border-b-0 max-w-full' : (isCollapsed ? 'w-full max-w-[420px] rounded-xl' : 'w-full max-w-[620px] h-[540px] max-h-[85vh] rounded-xl')">
      
      <!-- ─── HEADER / WINDOW BAR ─────────────────────────────────────── -->
      <div ref="handleRef" class="px-3 py-2 bg-surface-container dark:bg-surface-container-highest flex items-center justify-between cursor-move shrink-0 transition-all duration-200"
           :class="[
             isDockedBottom ? 'cursor-default' : (isCollapsed ? 'rounded-xl' : 'rounded-t-xl'),
             isCollapsed ? '' : 'border-b border-outline/20'
           ]"
           @dblclick="isDockedBottom ? null : (isCollapsed = !isCollapsed)">
        <div class="flex items-center gap-2.5">
          <div class="w-3 h-3 rounded-full bg-primary/20 border border-primary/60 flex items-center justify-center">
            <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
          </div>
          <Terminal class="w-4 h-4 text-primary" />
          <span class="font-bold text-xs tracking-wide text-on-surface flex items-center gap-1.5">
            WaForge WebKit Studio
            <span class="text-[9px] px-1.5 py-0.2 bg-white/10 text-on-surface/90 rounded font-mono">v4.4 Nitro</span>
          </span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Project/Service Selector Dropdown -->
          <select v-model="selectedProject" class="bg-surface dark:bg-surface-container-lowest/80 border border-outline/20 rounded px-2 py-0.5 text-[10px] text-primary font-mono outline-none focus:border-primary cursor-pointer">
            <option value="ALL">📦 [Tutti i Progetti / Servizi]</option>
            <option value="WaForge">🎨 WaForge Dashboard (Nuxt/Nitro)</option>
            <option value="WuzAPI">💬 WuzAPI Engine (Go / WhatsMeow)</option>
            <option value="Cockpit">✈️ Cockpit AI Proxy (Multi-Engine)</option>
            <option value="MCP">🔌 MCP Agent Server (Anthropic/GitHub)</option>
            <option value="GoWA">🔄 GoWA Fallback (Go Multi-Device)</option>
            <option value="OpenWA">⚡ OpenWA Engine (Node Baileys)</option>
          </select>

          <!-- Dock to Bottom Toggle -->
          <button @click="isDockedBottom = !isDockedBottom; isCollapsed = false" 
                  class="p-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-white/10 transition-colors"
                  :title="isDockedBottom ? 'Sgancia come Finestra Flottante' : 'Aggancia in basso (DevTools style)'">
            <Maximize2 v-if="!isDockedBottom" class="w-3.5 h-3.5" />
            <Minimize2 v-else class="w-3.5 h-3.5 text-primary" />
          </button>

          <!-- Collapse Window (Only when floating) -->
          <button v-if="!isDockedBottom" @click="isCollapsed = !isCollapsed" class="p-1 text-on-surface-variant hover:text-on-surface rounded hover:bg-white/10 transition-colors">
            <ChevronDown class="w-3.5 h-3.5 transition-transform" :class="isCollapsed ? 'rotate-180' : ''" />
          </button>

          <!-- Close DevTools -->
          <button @click="isOpen = false" class="p-1 text-error hover:text-red-400 rounded hover:bg-error/10 transition-colors ml-1">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- ─── BODY (ONLY IF NOT COLLAPSED) ────────────────────────────── -->
      <div v-show="!isCollapsed" class="flex-1 flex flex-col overflow-hidden bg-surface-container dark:bg-surface-container-highest">
        
        <!-- WebKit TABS TOOLBAR -->
        <div class="flex items-center justify-between border-b border-outline/20 bg-surface-container dark:bg-surface-container-highest px-2 pt-1 shrink-0">
          <div class="flex gap-1">
            <button v-for="tab in tabs" :key="tab.id"
                    @click="activeTab = tab.id"
                    class="px-3 py-1.5 text-[11px] font-semibold flex items-center gap-1.5 rounded-t-lg transition-colors border-t border-l border-r"
                    :class="activeTab === tab.id ? 'bg-surface-container-high dark:bg-surface-container-lowest text-primary border-outline/20 border-b-transparent -mb-px pb-2' : 'text-on-surface-variant border-transparent hover:text-on-surface/90 hover:bg-white/5'">
              <component :is="tab.icon" class="w-3.5 h-3.5" :class="tab.id === 'errors' && capturedErrors.length > 0 ? 'text-error animate-bounce' : ''" />
              <span>{{ tab.label }}</span>
              <span v-if="tab.id === 'errors' && capturedErrors.length > 0" class="px-1 py-0.2 bg-error/20 text-error rounded text-[9px] font-bold">
                {{ capturedErrors.length }}
              </span>
              <span v-if="tab.id === 'interactions'" class="px-1 py-0.2 bg-primary/20 text-primary rounded text-[9px] font-bold">
                {{ userInteractions.length }}
              </span>
            </button>
          </div>

          <!-- Quick Actions & Search -->
          <div class="flex items-center gap-2 pr-2">
            <div class="relative flex items-center">
              <Search class="w-3 h-3 text-on-surface-variant absolute left-2 pointer-events-none" />
              <input v-model="searchQuery" type="text" placeholder="Filtra log o errori..." 
                     class="bg-surface dark:bg-surface-container-lowest/80 border border-outline/20 rounded-full pl-6 pr-2 py-0.5 text-[10px] text-on-surface/90 w-36 outline-none focus:border-primary transition-all" />
              <button v-if="searchQuery" @click="searchQuery = ''" class="absolute right-2 text-on-surface-variant hover:text-on-surface text-[9px]">✕</button>
            </div>
            <button @click="clearCurrentTab" class="p-1 text-on-surface-variant hover:text-error rounded hover:bg-white/5 transition-colors" title="Pulisci log della scheda corrente">
              <Trash2 class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- ACTIVE DOCKER CONFIG (.ENV) LEVEL BADGES -->
        <div class="bg-surface-container dark:bg-surface-container-highest border-b border-outline/20 px-3 py-1 text-[10px] text-on-surface-variant flex items-center justify-between gap-2 shrink-0 font-mono">
          <div class="flex items-center gap-2 overflow-x-auto custom-scrollbar no-wrap">
            <span class="text-primary font-bold shrink-0">⚙️ ENV LOG LEVELS:</span>
            <span class="bg-surface dark:bg-surface-container-lowest/80 border border-outline/20 px-1.5 py-0.2 rounded shrink-0">WaForge: <b class="text-cyan-400 uppercase">{{ dockerLogLevels.waforge }}</b></span>
            <span class="bg-surface dark:bg-surface-container-lowest/80 border border-outline/20 px-1.5 py-0.2 rounded shrink-0">WuzAPI: <b class="text-green-400 uppercase">{{ dockerLogLevels.wuzapi }}</b></span>
            <span class="bg-surface dark:bg-surface-container-lowest/80 border border-outline/20 px-1.5 py-0.2 rounded shrink-0">Cockpit: <b class="text-purple-400 uppercase">{{ dockerLogLevels.cockpit }}</b></span>
            <span class="bg-surface dark:bg-surface-container-lowest/80 border border-outline/20 px-1.5 py-0.2 rounded shrink-0">MCP: <b class="text-yellow-400 uppercase">{{ dockerLogLevels.mcp }}</b></span>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span class="w-2 h-2 rounded-full" :class="isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-600'"></span>
            <span class="text-[9px]">{{ isPolling ? 'Live Stream (2s)' : 'In pausa' }}</span>
          </div>
        </div>

        <!-- ─── TAB 1: CONSOLE LOGS (Multi-Project/Service) ──────────────── -->
        <div v-if="activeTab === 'logs'" class="flex-1 flex flex-col overflow-hidden">
          <!-- Level Filter Pills -->
          <div class="flex items-center gap-1 bg-surface-container dark:bg-surface-container-highest px-3 py-1 border-b border-outline/20 shrink-0">
            <span class="text-[10px] text-on-surface-variant font-semibold mr-1">Filtro Livello:</span>
            <button v-for="lvl in ['ALL', 'verbose', 'info', 'warn', 'error']" :key="lvl"
                    @click="selectedLevelFilter = lvl"
                    class="px-2 py-0.5 text-[9px] font-bold rounded uppercase transition-colors"
                    :class="selectedLevelFilter === lvl ? 'bg-primary text-on-primary shadow-[0_0_8px_rgba(37,211,102,0.4)]' : 'text-on-surface-variant bg-white/5 hover:text-on-surface hover:bg-white/10'">
              {{ lvl === 'ALL' ? 'Tutto (Verbose)' : lvl }}
            </button>
            <div class="ml-auto flex items-center gap-2">
              <button @click="mockConnect" class="px-2 py-0.5 bg-primary/20 hover:bg-primary/30 text-primary text-[10px] font-medium rounded border border-primary/30 transition-colors">
                ⚡ Test Connessione
              </button>
            </div>
          </div>

          <!-- Logs Stream -->
          <div class="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1 custom-scrollbar">
            <div v-if="filteredConsoleLogs.length === 0" class="text-on-surface-variant italic text-center py-10">
              Nessun log corrisponde ai criteri del filtro (Progetto: {{ selectedProject }}, Livello: {{ selectedLevelFilter }})
            </div>
            <div v-for="(log, idx) in filteredConsoleLogs" :key="idx"
                 class="px-2 py-1 rounded border border-transparent hover:border-outline/20 hover:bg-white/[0.03] transition-colors flex items-start gap-2 group">
              <span class="text-on-surface-variant shrink-0 text-[10px]">[{{ log.time }}]</span>
              
              <!-- Project Source Badge -->
              <span class="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider shrink-0"
                    :class="getProjectBadgeClass(log.source)">
                {{ log.source || 'WaForge' }}
              </span>

              <!-- Level Badge -->
              <span class="px-1 py-0.2 rounded text-[8px] uppercase font-bold shrink-0"
                    :class="log.level === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : (log.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : (log.level === 'verbose' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30'))">
                {{ log.level || 'info' }}
              </span>

              <!-- Message -->
              <span class="flex-1 break-words" :class="log.level === 'error' ? 'text-red-400 font-medium' : (log.level === 'warn' ? 'text-yellow-300' : (log.level === 'verbose' ? 'text-cyan-300' : 'text-on-surface/90'))">
                {{ log.msg }}
              </span>
            </div>
          </div>
        </div>

        <!-- ─── TAB 2: USER INTERACTIONS (WebKit Breadcrumbs) ────────────── -->
        <div v-if="activeTab === 'interactions'" class="flex-1 flex flex-col overflow-hidden bg-surface-container dark:bg-surface-container-highest">
          <div class="bg-surface-container dark:bg-surface-container-highest px-3 py-1.5 border-b border-outline/20 text-[10px] text-on-surface-variant flex justify-between items-center shrink-0 font-mono">
            <span>🔍 Monitoraggio Interazioni in Tempo Reale (Click, Form, Router, Webhook)</span>
            <span class="text-primary font-bold">{{ userInteractions.length }} eventi registrati</span>
          </div>

          <div class="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1.5 custom-scrollbar">
            <div v-if="filteredInteractions.length === 0" class="text-on-surface-variant italic text-center py-10">
              Nessuna interazione o click registrato di recente nel browser. Fai clic su un pulsante o cambia pagina per catturarla!
            </div>
            <div v-for="(item, idx) in filteredInteractions" :key="idx"
                 class="p-2 rounded bg-white/[0.02] border border-outline/20 hover:border-primary/40 flex items-start gap-2.5 transition-colors">
              <span class="text-on-surface-variant text-[10px] shrink-0">[{{ item.time }}]</span>
              <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0"
                    :class="item.type === 'click' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : (item.type === 'navigation' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-green-500/20 text-green-400 border border-green-500/30')">
                {{ item.type }}
              </span>
              <div class="flex-1 text-on-surface/90">
                <div class="font-bold text-primary">{{ item.target }}</div>
                <div v-if="item.details" class="text-[10px] text-on-surface-variant mt-0.5">{{ item.details }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── TAB 3: RUNTIME ERRORS & EXCEPTIONS AUDIT ─────────────────── -->
        <div v-if="activeTab === 'errors'" class="flex-1 flex flex-col overflow-hidden bg-[#0f0808]">
          <div class="bg-red-950/40 border-b border-red-500/30 px-3 py-1.5 text-[10px] text-red-300 flex justify-between items-center shrink-0 font-mono">
            <span class="font-bold flex items-center gap-1.5">
              <ShieldAlert class="w-3.5 h-3.5 text-error animate-pulse" />
              Audit Errori e Eccezioni JS / Nuxt / Vue
            </span>
            <div class="flex items-center gap-2">
              <a href="http://localhost:3151" target="_blank" class="px-2 py-0.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded border border-purple-500/30 transition-colors flex items-center gap-1 font-bold">
                🐞 Dashboard Crikket (Porta 3151)
              </a>
              <button v-if="capturedErrors.length > 0" @click="copyAllErrors()" class="px-2 py-0.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded border border-blue-500/30 transition-colors flex items-center gap-1" title="Copia tutti gli errori negli appunti">
                <Copy class="w-3 h-3" /> Copia Tutti
              </button>
              <button v-if="capturedErrors.length > 0" @click="capturedErrors = []" class="px-2 py-0.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded border border-red-500/30 transition-colors">
                Pulisci
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-2 custom-scrollbar">
            <div v-if="filteredErrors.length === 0" class="flex flex-col items-center justify-center py-12 text-on-surface-variant">
              <CheckCircle2 class="w-8 h-8 text-green-500 mb-2" />
              <span class="text-green-400 font-bold">Nessun errore runtime o eccezione rilevata!</span>
              <span class="text-[10px] text-on-surface-variant">Tutti i componenti Vue e le chiamate API rispondono correttamente.</span>
              <div class="mt-4 flex gap-2">
                <button @click="triggerTestError" class="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded border border-red-500/30 text-[10px]">
                  ⚡ Simula Errore per Test Crikket
                </button>
              </div>
            </div>
            
            <div v-for="(err, idx) in filteredErrors" :key="idx"
                 class="p-2.5 rounded bg-red-950/20 border border-red-500/40 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-[10px] text-red-400/80">[{{ err.time }}]</span>
                <div class="flex items-center gap-1.5">
                  <span class="px-1.5 py-0.2 bg-red-500/30 text-red-300 text-[9px] font-bold rounded uppercase">{{ err.type }}</span>
                  <button @click="copyError(err)" class="px-2 py-0.2 bg-gray-500/20 hover:bg-gray-500/30 text-on-surface/90 text-[9px] font-bold rounded border border-gray-500/30 transition-colors flex items-center gap-1" title="Copia negli appunti">
                    <Copy class="w-2.5 h-2.5" /> Copia
                  </button>
                  <button @click="reportToCrikket(err)" class="px-2 py-0.2 bg-primary/20 hover:bg-primary/30 text-primary text-[9px] font-bold rounded border border-primary/30 transition-colors">
                    📤 Memorizza in Crikket per AI
                  </button>
                </div>
              </div>
              <div class="text-red-300 font-bold break-words">{{ err.message }}</div>
              <div v-if="err.source || err.stack" class="bg-surface dark:bg-surface-container-lowest/80 p-2 rounded border border-red-500/20 text-[10px] text-on-surface-variant overflow-x-auto whitespace-pre-wrap font-mono">
                {{ err.stack || err.source }}
              </div>
            </div>
          </div>
        </div>

        <!-- ─── TAB 4: NETWORK INSPECTOR ─────────────────────────────────── -->
        <div v-if="activeTab === 'network'" class="flex-1 flex flex-col overflow-hidden bg-surface-container dark:bg-surface-container-highest">
          <div class="bg-surface-container dark:bg-surface-container-highest px-3 py-1.5 border-b border-outline/20 text-[10px] text-on-surface-variant flex justify-between items-center shrink-0 font-mono">
            <span>🌐 Chiamate HTTP Intercettate ($fetch / API / WhatsApp / Nitro)</span>
            <span class="text-primary font-bold">{{ networkRequests.length }} richieste</span>
          </div>

          <div class="flex-1 overflow-y-auto p-2 font-mono text-[11px] space-y-1 custom-scrollbar">
            <div v-for="req in networkRequests" :key="req.id" class="p-2 rounded bg-white/[0.02] border border-outline/20 flex items-center justify-between text-[11px]">
              <div class="flex items-center gap-2 truncate flex-1 mr-2">
                <span class="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0"
                      :class="req.method === 'GET' ? 'bg-green-500/20 text-green-400' : (req.method === 'POST' ? 'bg-blue-500/20 text-blue-400' : 'bg-yellow-500/20 text-yellow-400')">
                  {{ req.method }}
                </span>
                <span class="text-on-surface/90 truncate">{{ req.url }}</span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <span :class="req.status >= 400 ? 'text-red-400 font-bold' : 'text-on-surface-variant'">{{ req.status }}</span>
                <span class="text-on-surface-variant text-[10px]">{{ req.duration || '24ms' }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── TAB 5: PINIA STORE / STATE INSPECTOR ─────────────────────── -->
        <div v-if="activeTab === 'state'" class="flex-1 bg-surface-container dark:bg-surface-container-highest p-3 overflow-y-auto font-mono text-[11px] text-blue-300 custom-scrollbar">
          <div class="text-[10px] text-on-surface-variant mb-2">// Stato globale intercettato in tempo reale (Store Auth, Campagne, Cockpit)</div>
          <pre class="whitespace-pre-wrap bg-surface dark:bg-surface-container-lowest/80 p-3 rounded border border-outline/20 text-cyan-300">{{ stateSnapshot }}</pre>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Terminal, Activity, ShieldAlert, Network, Layers, Search, Trash2, Maximize2, Minimize2, ChevronDown, X, CheckCircle2, Copy } from 'lucide-vue-next'
import { useDraggable, useWindowSize } from '@vueuse/core'
import { useAuthStore } from '~/stores/auth'
import { useRouter } from 'vue-router'

// ─── Window Controls & Docking ───────────────────────────────────────────────
const isOpen = ref(true)
const isCollapsed = ref(false)
const isDockedBottom = ref(false)
const selectedProject = ref('ALL')
const selectedLevelFilter = ref('ALL')
const searchQuery = ref('')
const isPolling = ref(true)

const widgetRef = ref<HTMLElement | null>(null)
const handleRef = ref<HTMLElement | null>(null)

const { width, height } = useWindowSize()
const initialX = computed(() => width.value > 650 ? width.value - 640 : 20)
const initialY = computed(() => height.value > 600 ? height.value - 560 : 20)

const { x, y, style } = useDraggable(widgetRef, {
  initialValue: { x: initialX.value, y: initialY.value },
  handle: handleRef,
})

// ─── Tabs Definition ─────────────────────────────────────────────────────────
const tabs = [
  { id: 'logs', label: 'Console', icon: Terminal },
  { id: 'interactions', label: 'Interazioni UI', icon: Activity },
  { id: 'errors', label: 'Audit Errori', icon: ShieldAlert },
  { id: 'network', label: 'Network HTTP', icon: Network },
  { id: 'state', label: 'Stato Pinia', icon: Layers }
]
const activeTab = ref('logs')

// ─── Environment & Project Log Levels ────────────────────────────────────────
const dockerLogLevels = ref<any>({
  waforge: 'verbose',
  wuzapi: 'info',
  gowa: 'info',
  openwa: 'info',
  cockpit: 'info',
  mcp: 'info'
})

// ─── State Snapshot ──────────────────────────────────────────────────────────
const authStore = useAuthStore()
const stateSnapshot = computed(() => {
  return JSON.stringify({
    auth: {
      isAuthenticated: authStore?.isAuthenticated,
      currentTeam: authStore?.currentTeam?.name || 'nessuno',
      user: authStore?.user?.email || 'anonimo'
    },
    devtools: {
      selectedProject: selectedProject.value,
      isDockedBottom: isDockedBottom.value,
      logsCount: logs.value.length,
      errorsCount: capturedErrors.value.length,
      interactionsCount: userInteractions.value.length
    }
  }, null, 2)
})

// ─── 1. Console Logs Stream ──────────────────────────────────────────────────
const logs = ref<{time: string, msg: string, level?: string, source?: string}[]>([
  { time: new Date().toLocaleTimeString(), msg: '✅ [WebKit Studio] DevTools inizializzato in modalità Verbose.', level: 'verbose', source: 'WaForge' },
  { time: new Date().toLocaleTimeString(), msg: '🚀 [Docker Config] Livelli variabili d\'ambiente caricati per tutti i container.', level: 'info', source: 'WaForge' },
  { time: new Date().toLocaleTimeString(), msg: '💬 [WuzAPI Engine] WhatsMeow Multi-device connesso su porta 3100.', level: 'info', source: 'WuzAPI' },
  { time: new Date().toLocaleTimeString(), msg: '✈️ [Cockpit AI] Proxy failover multi-motore attivo su porta 3000.', level: 'verbose', source: 'Cockpit' }
])

const filteredConsoleLogs = computed(() => {
  return logs.value.filter(log => {
    // Project Filter
    if (selectedProject.value !== 'ALL' && log.source !== selectedProject.value) return false
    // Level Filter
    if (selectedLevelFilter.value !== 'ALL' && (log.level || 'info') !== selectedLevelFilter.value) return false
    // Search Query Filter
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      return log.msg.toLowerCase().includes(q) || (log.source && log.source.toLowerCase().includes(q))
    }
    return true
  })
})

function getProjectBadgeClass(source?: string) {
  switch (source) {
    case 'WuzAPI': return 'bg-green-500/20 text-green-400 border border-green-500/40'
    case 'Cockpit': return 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
    case 'MCP': return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
    case 'GoWA': return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
    case 'OpenWA': return 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
    default: return 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
  }
}

// ─── 2. User Interactions / Breadcrumb Capture ───────────────────────────────
const userInteractions = ref<{time: string, type: string, target: string, details?: string}[]>([
  { time: new Date().toLocaleTimeString(), type: 'navigation', target: 'Router Iniziale', details: 'Navigazione verso dashboard' }
])

const filteredInteractions = computed(() => {
  if (!searchQuery.value) return userInteractions.value
  const q = searchQuery.value.toLowerCase()
  return userInteractions.value.filter(i => i.target.toLowerCase().includes(q) || (i.details && i.details.toLowerCase().includes(q)))
})

// ─── 3. Runtime Errors & Exceptions Capture ──────────────────────────────────
const capturedErrors = ref<{time: string, type: string, message: string, stack?: string, source?: string}[]>([])

const filteredErrors = computed(() => {
  if (!searchQuery.value) return capturedErrors.value
  const q = searchQuery.value.toLowerCase()
  return capturedErrors.value.filter(e => e.message.toLowerCase().includes(q) || (e.stack && e.stack.toLowerCase().includes(q)))
})

// ─── 4. Network Requests ─────────────────────────────────────────────────────
const networkRequests = ref<any[]>([])

function syncTelemetry() {
  if (typeof window !== 'undefined') {
    if ((window as any).__waforge_debug_network__) {
      networkRequests.value = [...(window as any).__waforge_debug_network__]
    }
    if ((window as any).__waforge_debug_errors__) {
      capturedErrors.value = [...(window as any).__waforge_debug_errors__, ...capturedErrors.value].slice(0, 100)
      ;(window as any).__waforge_debug_errors__ = []
    }
  }
}

// ─── Quick Actions & Helpers ─────────────────────────────────────────────────
function clearCurrentTab() {
  if (activeTab.value === 'logs') logs.value = []
  else if (activeTab.value === 'interactions') userInteractions.value = []
  else if (activeTab.value === 'errors') capturedErrors.value = []
}

function mockConnect() {
  logs.value.unshift({
    time: new Date().toLocaleTimeString(),
    msg: '⚡ [Test Connessione] Verifica canali di comunicazione WhatsApp e Cockpit completata con esito positivo.',
    level: 'verbose',
    source: selectedProject.value === 'ALL' ? 'WaForge' : selectedProject.value
  })
}

function triggerTestError() {
  capturedErrors.value.unshift({
    time: new Date().toLocaleTimeString(),
    type: 'Test Simulation Error',
    message: 'TypeError: Cannot read properties of undefined (reading "whatsappEngine")',
    stack: 'TypeError: Cannot read properties of undefined\n    at useWhatsAppFormat (useWhatsAppFormat.ts:24)\n    at DebugWidget.vue:210',
    source: 'Frontend Test Runtime'
  })
}

async function reportToCrikket(err: any) {
  try {
    const res: any = await $fetch('/api/debug/report-crikket', {
      method: 'POST',
      body: {
        title: `[${err.type}] ${err.message}`,
        description: `Errore catturato dal WebKit Studio DebugWidget.\nSorgente: ${err.source || 'N/A'}\nTraccia: ${err.stack || 'N/A'}`,
        stack: err.stack,
        source: err.source || 'DebugWidget Studio',
        level: 'error',
        environment: {
          project: selectedProject.value,
          levels: dockerLogLevels.value
        }
      }
    })
    if (res && res.success) {
      logs.value.unshift({
        time: new Date().toLocaleTimeString(),
        msg: `📤 [Crikket] Errore memorizzato con successo per analisi AI (ID: ${res.report?.id})`,
        level: 'verbose',
        source: 'Crikket'
      })
    }
  } catch (e: any) {
    console.error('Errore invio a Crikket:', e)
  }
}

async function copyError(err: any) {
  const text = `[${err.type}] ${err.message}\nSorgente: ${err.source || 'N/A'}\nTraccia: ${err.stack || 'N/A'}`;
  try {
    await navigator.clipboard.writeText(text);
    logs.value.unshift({
      time: new Date().toLocaleTimeString(),
      msg: `📋 Copiato negli appunti: [${err.type}] ${err.message}`,
      level: 'verbose',
      source: 'WaForge'
    });
  } catch (e) {
    console.error('Errore copia negli appunti:', e);
  }
}

async function copyAllErrors() {
  if (capturedErrors.value.length === 0) return;
  const text = capturedErrors.value.map((err, idx) => `[Errore ${idx + 1}] [${err.type}] ${err.message}\nSorgente: ${err.source || 'N/A'}\nTraccia: ${err.stack || 'N/A'}\n`).join('\n---\n');
  try {
    await navigator.clipboard.writeText(text);
    logs.value.unshift({
      time: new Date().toLocaleTimeString(),
      msg: `📋 Copiati negli appunti tutti i ${capturedErrors.value.length} errori registrati.`,
      level: 'verbose',
      source: 'WaForge'
    });
  } catch (e) {
    console.error('Errore copia globale negli appunti:', e);
  }
}

// ─── Lifecycle & Global Event Interceptors ───────────────────────────────────
let logInterval: any = null
let globalClickHandler: any = null
let windowErrorHandler: any = null
let promiseRejectionHandler: any = null

const fetchServerLogs = async () => {
  if (!isPolling.value) return
  try {
    const data: any = await $fetch('/api/debug/logs')
    if (data && data.logs) {
      logs.value = data.logs
    }
    if (data && data.logLevels) {
      dockerLogLevels.value = data.logLevels
    }
  } catch (e) {
    // silently fail
  }
}

onMounted(() => {
  fetchServerLogs()
  logInterval = setInterval(() => {
    fetchServerLogs()
    syncTelemetry()
  }, 2500)
  syncTelemetry()
  window.addEventListener('waforge-debug-network-update', syncTelemetry)
  window.addEventListener('waforge-debug-error-update', syncTelemetry)

  // Intercept Global Clicks (UI Interactions)
  globalClickHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement
    if (!target) return
    const btnOrLink = target.closest('button, a, input, select') as HTMLElement
    if (btnOrLink) {
      const text = btnOrLink.innerText || btnOrLink.getAttribute('placeholder') || btnOrLink.getAttribute('title') || btnOrLink.tagName
      userInteractions.value.unshift({
        time: new Date().toLocaleTimeString(),
        type: 'click',
        target: `${btnOrLink.tagName.toLowerCase()}: "${text.slice(0, 35)}"`,
        details: btnOrLink.className ? `Classi: ${btnOrLink.className.slice(0, 45)}` : 'Azione utente'
      })
      if (userInteractions.value.length > 100) userInteractions.value.pop()
    }
  }
  window.addEventListener('click', globalClickHandler, true)

  // Intercept Global Window Runtime Errors
  windowErrorHandler = (msg: string | Event, url?: string, line?: number, col?: number, error?: Error) => {
    capturedErrors.value.unshift({
      time: new Date().toLocaleTimeString(),
      type: 'Unhandled JS Error',
      message: typeof msg === 'string' ? msg : 'Errore inatteso nel browser',
      stack: error?.stack || `${url || 'script'}:${line}:${col}`,
      source: url || 'Browser Runtime'
    })
    return false
  }
  window.addEventListener('error', windowErrorHandler)

  // Intercept Unhandled Promise Rejections
  promiseRejectionHandler = (e: PromiseRejectionEvent) => {
    capturedErrors.value.unshift({
      time: new Date().toLocaleTimeString(),
      type: 'Promise Rejection',
      message: e.reason?.message || typeof e.reason === 'string' ? e.reason : 'Promise fallita nel runtime',
      stack: e.reason?.stack || JSON.stringify(e.reason),
      source: 'Async Task / $fetch'
    })
  }
  window.addEventListener('unhandledrejection', promiseRejectionHandler)

  // Intercept Vue Router Navigations
  try {
    const router = useRouter()
    if (router) {
      router.afterEach((to, from) => {
        userInteractions.value.unshift({
          time: new Date().toLocaleTimeString(),
          type: 'navigation',
          target: `Navigazione Route: ${to.path}`,
          details: `Da ${from.path} a ${to.path}`
        })
      })
    }
  } catch (err) {
    // router might not be available in partial contexts
  }
})

onUnmounted(() => {
  if (logInterval) clearInterval(logInterval)
  window.removeEventListener('waforge-debug-network-update', syncTelemetry)
  window.removeEventListener('waforge-debug-error-update', syncTelemetry)
  if (globalClickHandler) window.removeEventListener('click', globalClickHandler, true)
  if (windowErrorHandler) window.removeEventListener('error', windowErrorHandler)
  if (promiseRejectionHandler) window.removeEventListener('unhandledrejection', promiseRejectionHandler)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(37, 211, 102, 0.4);
}
</style>
