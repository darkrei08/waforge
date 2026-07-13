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
            <p class="font-semibold text-sm">{{ t(`settings.engine_${eng}`) }}</p>
            <p class="text-xs mt-1 opacity-70">{{ t(`settings.engine_${eng}_desc`) }}</p>
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
            <!-- Account Cockpit Disponibili -->
            <div class="mt-4">
              <div class="flex items-center justify-between mb-3">
                <label class="block text-sm text-on-surface-variant font-medium">Seleziona Account Attivo per WaForge</label>
                <button @click="refreshCockpit" :disabled="refreshingCockpit"
                        class="text-xs bg-white/5 hover:bg-white/10 text-on-surface-variant px-3 py-1.5 rounded-lg transition-colors border border-white/10 flex items-center gap-1.5">
                  <span v-if="refreshingCockpit" class="animate-spin">⟳</span>
                  <span v-else>🔄</span>
                  Verifica Cockpit
                </button>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div v-for="acc in cockpitStatus.accounts" :key="acc.id" 
                     @click="store.llmSettings.cockpitAccountId = acc.id"
                     class="relative p-5 rounded-xl border transition-all cursor-pointer flex flex-col gap-4"
                     :class="store.llmSettings.cockpitAccountId === acc.id ? 'bg-primary/5 border-primary shadow-[0_0_15px_rgba(37,211,102,0.15)]' : 'bg-surface border-white/5 hover:border-white/20'">
                  
                  <!-- Intestazione Card -->
                  <div class="flex justify-between items-start">
                    <div class="flex items-center gap-2">
                      <div class="w-2.5 h-2.5 rounded-full" :class="store.llmSettings.cockpitAccountId === acc.id ? 'bg-primary' : 'bg-white/20'"></div>
                      <span class="text-sm font-semibold text-on-surface truncate max-w-[160px]" :title="acc.email">{{ acc.email.split('@')[0] }}</span>
                    </div>
                    <span class="text-[11px] font-bold px-2.5 py-1 rounded-full" 
                          :class="acc.tier === 'PRO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-white/10 text-white/50 border border-white/10'">
                      {{ acc.tier }}
                    </span>
                  </div>

                  <!-- Quote Grid -->
                  <div class="grid grid-cols-2 gap-5 mt-1">
                    <!-- Colonna Claude -->
                    <div class="space-y-3">
                      <h5 class="text-xs font-bold text-on-surface-variant">Claude</h5>
                      <!-- Claude 5h -->
                      <div v-if="getModelQuota(acc, '3p-5h')" class="space-y-1.5">
                        <div class="flex justify-between text-[11px] font-medium">
                          <span class="text-white/50">5h</span>
                          <span :class="getModelQuota(acc, '3p-5h').percentage > 10 ? 'text-primary' : 'text-red-400'">{{ getModelQuota(acc, '3p-5h').percentage }}%</span>
                        </div>
                        <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-500" 
                               :class="getModelQuota(acc, '3p-5h').percentage > 10 ? 'bg-primary' : 'bg-red-500'" 
                               :style="`width: ${getModelQuota(acc, '3p-5h').percentage}%`"></div>
                        </div>
                        <div class="text-[11px] text-white/40 pt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                          {{ formatDate(getModelQuota(acc, '3p-5h').reset_time) }}
                        </div>
                      </div>
                      
                      <!-- Claude Weekly -->
                      <div v-if="getModelQuota(acc, '3p-weekly')" class="space-y-1.5 pt-1">
                        <div class="flex justify-between text-[11px] font-medium">
                          <span class="text-white/50">Weekly</span>
                          <span :class="getModelQuota(acc, '3p-weekly').percentage > 10 ? 'text-yellow-400' : 'text-red-400'">{{ getModelQuota(acc, '3p-weekly').percentage }}%</span>
                        </div>
                        <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-500" 
                               :class="getModelQuota(acc, '3p-weekly').percentage > 10 ? 'bg-yellow-500' : 'bg-red-500'" 
                               :style="`width: ${getModelQuota(acc, '3p-weekly').percentage}%`"></div>
                        </div>
                        <div class="text-[11px] text-white/40 pt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                          {{ formatDate(getModelQuota(acc, '3p-weekly').reset_time) }}
                        </div>
                      </div>
                    </div>

                    <!-- Colonna Gemini -->
                    <div class="space-y-3">
                      <h5 class="text-xs font-bold text-on-surface-variant">Gemini</h5>
                      <!-- Gemini 5h -->
                      <div v-if="getModelQuota(acc, 'gemini-5h')" class="space-y-1.5">
                        <div class="flex justify-between text-[11px] font-medium">
                          <span class="text-white/50">5h</span>
                          <span :class="getModelQuota(acc, 'gemini-5h').percentage > 10 ? 'text-primary' : 'text-red-400'">{{ getModelQuota(acc, 'gemini-5h').percentage }}%</span>
                        </div>
                        <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-500" 
                               :class="getModelQuota(acc, 'gemini-5h').percentage > 10 ? 'bg-primary' : 'bg-red-500'" 
                               :style="`width: ${getModelQuota(acc, 'gemini-5h').percentage}%`"></div>
                        </div>
                        <div class="text-[11px] text-white/40 pt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                          {{ formatDate(getModelQuota(acc, 'gemini-5h').reset_time) }}
                        </div>
                      </div>
                      
                      <!-- Gemini Weekly -->
                      <div v-if="getModelQuota(acc, 'gemini-weekly')" class="space-y-1.5 pt-1">
                        <div class="flex justify-between text-[11px] font-medium">
                          <span class="text-white/50">Weekly</span>
                          <span :class="getModelQuota(acc, 'gemini-weekly').percentage > 10 ? 'text-primary' : 'text-red-400'">{{ getModelQuota(acc, 'gemini-weekly').percentage }}%</span>
                        </div>
                        <div class="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div class="h-full rounded-full transition-all duration-500" 
                               :class="getModelQuota(acc, 'gemini-weekly').percentage > 10 ? 'bg-primary' : 'bg-red-500'" 
                               :style="`width: ${getModelQuota(acc, 'gemini-weekly').percentage}%`"></div>
                        </div>
                        <div class="text-[11px] text-white/40 pt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
                          {{ formatDate(getModelQuota(acc, 'gemini-weekly').reset_time) }}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="!store.llmSettings.useCockpit" class="space-y-4">
          <div class="bg-primary/10 border border-primary/20 p-3 rounded-lg mb-4">
            <p class="text-xs text-primary font-medium mb-1">Provider Supportati (Richiedono API Key o Localhost):</p>
            <ul class="text-xs text-primary/80 list-disc list-inside space-y-0.5">
              <li><strong>OpenAI</strong> (GPT-4, GPT-3.5)</li>
              <li><strong>Anthropic</strong> (Claude 3.5 Sonnet, Opus, Haiku)</li>
              <li><strong>Google Gemini</strong> (Pro, Flash)</li>
              <li><strong>Cohere</strong> (Command R)</li>
              <li><strong>Custom</strong> (Modelli Locali via LM Studio / Ollama)</li>
            </ul>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="flex justify-between items-center mb-1">
                <label class="text-sm text-on-surface-variant font-medium">Provider LLM</label>
                <div class="flex items-center gap-2">
                  <span v-if="store.catalogLoading" class="text-xs text-on-surface-variant flex items-center gap-1">
                    <Clock class="w-3 h-3 animate-spin" /> Caricamento...
                  </span>
                  <span v-else-if="store.catalogSources.includes('fallback')" class="text-xs px-2 py-0.5 rounded bg-surface-variant text-on-surface-variant border border-white/5" title="Fallback locale (nessuna API key o network error)">
                    ⚪ Catalogo Locale
                  </span>
                  <span v-else class="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 flex items-center gap-1" :title="`Live sources: ${store.catalogSources.join(', ')}`">
                    🟢 Catalogo Live
                  </span>
                  <button @click="store.fetchModelCatalog(true)" :disabled="store.catalogLoading" class="text-xs text-secondary hover:text-primary transition-colors disabled:opacity-50" title="Forza Aggiornamento">
                    🔄
                  </button>
                </div>
              </div>
              <select v-model="store.llmSettings.provider" class="w-full mt-1 p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors capitalize">
                <option v-for="p in dynamicProviders" :key="p" :value="p">{{ p === 'openai' ? 'OpenAI' : p }}</option>
                <option value="custom">Custom (Locale / LM Studio)</option>
              </select>
            </div>
            <div>
              <label class="text-sm text-on-surface-variant font-medium">Modello</label>
              <select v-model="store.llmSettings.model"
                      class="w-full mt-1 p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors">
                <optgroup v-for="group in modelGroups" :key="group.category" :label="`${group.icon} ${group.label}`">
                  <option v-for="m in group.models" :key="m.id" :value="m.id">{{ m.name }}</option>
                </optgroup>
                <optgroup label="✏️ Custom">
                  <option value="__custom__">Inserisci manualmente...</option>
                </optgroup>
              </select>
              <div v-if="store.llmSettings.model === '__custom__' || isCustomModel" class="mt-2">
                <input v-model="customModelId" type="text" :placeholder="`es. ${store.llmSettings.provider === 'openai' ? 'gpt-4o' : 'model-id'}`"
                       @blur="applyCustomModel"
                       class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors" />
              </div>
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
              <div class="flex gap-2">
                <button @click="showCustomCatalogForm = !showCustomCatalogForm" class="text-xs text-secondary hover:text-secondary-fixed-dim">+ Crea Preset</button>
                <button @click="store.llmSettings.mcpServers.push('')" class="text-xs text-primary hover:text-primary-fixed-dim">+ Aggiungi Manuale</button>
              </div>
            </label>
            
            <!-- Form per creare un preset custom -->
            <div v-if="showCustomCatalogForm" class="mt-2 p-3 bg-white/5 border border-white/10 rounded-lg space-y-2">
              <h4 class="text-xs font-semibold text-on-surface-variant mb-2">Nuovo Preset MCP</h4>
              <div class="grid grid-cols-2 gap-2">
                <input v-model="newCustomMcp.name" type="text" placeholder="Nome (es. Twitter)" class="p-2 bg-black/30 border border-white/10 rounded text-xs text-on-surface focus:border-secondary outline-none" />
                <input v-model="newCustomMcp.icon" type="text" placeholder="Icona (es. 🐦 o URL immagine)" class="p-2 bg-black/30 border border-white/10 rounded text-xs text-on-surface focus:border-secondary outline-none" />
                <input v-model="newCustomMcp.cmd" type="text" placeholder="Comando (es. npx -y @modelcontextprotocol/server-twitter)" class="col-span-2 p-2 bg-black/30 border border-white/10 rounded text-xs text-on-surface focus:border-secondary outline-none font-mono" />
              </div>
              <div class="flex justify-end pt-1">
                <button @click="saveCustomMcp" :disabled="!newCustomMcp.name || !newCustomMcp.cmd" class="text-xs bg-secondary text-on-secondary px-3 py-1 rounded disabled:opacity-50">Salva Preset</button>
              </div>
            </div>

            <!-- Help box esplicativo e guida alla configurazione -->
            <div class="mt-2.5 p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs text-on-surface-variant space-y-1.5">
              <div class="flex items-center gap-1.5 font-bold text-primary">
                <span>ℹ️</span> Come configurare i Server MCP & Memoria di Progetto
              </div>
              <p>
                I server <strong>MCP (Model Context Protocol)</strong> collegano l'AI Assistant a strumenti esterni in tempo reale. Clicca su un <strong>badge rapido</strong> qui sotto per aggiungerlo all'elenco dei server attivi, oppure clicca <em>"+ Aggiungi Manuale"</em> per inserire un comando personalizzato (es. <code>npx -y @modelcontextprotocol/server-xyz</code>).
              </p>
              <div class="pt-1 border-t border-white/5 space-y-1">
                <p><strong>🧠 Memoria di Progetto (`Memory`):</strong> Abilitando il server <code>Memory</code> (o <code>Sequential Thinking</code>), l'assistente AI manterrà un knowledge graph persistente di tutte le chiamate, preferenze e istruzioni della tua azienda tra una sessione e l'altra.</p>
                <p><strong>✈️ Cockpit Tools:</strong> Consente all'AI di monitorare in tempo reale lo stato, i crediti e i limiti delle quote (Claude/Gemini/OpenAI) sugli account Cockpit attivi ed effettuare controlli diagnostici automatici.</p>
              </div>
            </div>

            <!-- Catalogo MCP Rapido -->
            <div class="mt-3 flex flex-wrap gap-2">
              <button v-for="mcp in [...mcpCatalog, ...(store.llmSettings.customCatalog || [])]" :key="mcp.name"
                      @click="addMcpServer(mcp.cmd)"
                      class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 hover:border-primary/50 transition-colors text-xs text-on-surface-variant hover:text-on-surface"
                      :title="mcp.desc || 'Preset personalizzato'">
                <img v-if="mcp.icon && mcp.icon.startsWith('http')" :src="mcp.icon" class="w-4 h-4 rounded-sm object-cover" />
                <span v-else>{{ mcp.icon }}</span>
                <span>{{ mcp.name }}</span>
              </button>
            </div>

            <div class="space-y-2 mt-4">
              <div v-for="(server, idx) in store.llmSettings.mcpServers" :key="idx" class="flex gap-2">
                <input v-model="store.llmSettings.mcpServers[idx]" type="text" placeholder="es. npx -y @modelcontextprotocol/server-everything"
                       class="flex-1 p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none transition-colors" />
                <button @click="store.llmSettings.mcpServers.splice(idx, 1)" class="p-3 text-red-400 hover:text-red-300 bg-white/5 rounded-lg">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
              <p v-if="!store.llmSettings.mcpServers?.length" class="text-xs text-on-surface-variant">Nessun server MCP configurato. Clicca "+ Aggiungi Manuale" o usa un preset.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Save -->
      <div class="flex items-center gap-4">
        <button @click="saveSettings" :disabled="store.loading"
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
import { ref, computed, watch, onMounted } from 'vue'
import { Wifi, Clock, Shield, Palette } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useSettingsStore } from '~/stores/settings'
import { getModelsGroupedByCategory, getProviders } from '~/lib/llm-models'

const { t } = useI18n()
const store = useSettingsStore()
const error = ref('')

const showCustomCatalogForm = ref(false)
const cockpitStatus = ref({ available: false, accounts: [] as any[] })
const customModelId = ref('')

// Reactive dynamic providers list
const dynamicProviders = computed(() => getProviders(store.dynamicModels))

// Reactive model catalog grouped by category, re-computed when provider or dynamicModels changes
const modelGroups = computed(() => getModelsGroupedByCategory(store.llmSettings.provider, store.dynamicModels))
const knownModelIds = computed(() => {
  const models = store.dynamicModels.length ? store.dynamicModels : [] // fallback handled in getModelsGroupedByCategory but we can just map the groups
  return modelGroups.value.flatMap(g => g.models).map(m => m.id)
})
const isCustomModel = computed(() => {
  const currentModel = store.llmSettings.model
  return currentModel && currentModel !== '__custom__' && !knownModelIds.value.includes(currentModel)
})

// When provider changes, auto-select the first available model, and refresh dynamic catalog if needed
watch(() => store.llmSettings.provider, (newProvider) => {
  // If we don't have models for this provider, try fetching
  if (newProvider !== 'custom') {
    store.fetchModelCatalog()
  }
  
  const modelsForProv = modelGroups.value.flatMap(g => g.models)
  if (modelsForProv.length > 0 && !knownModelIds.value.includes(store.llmSettings.model)) {
    store.llmSettings.model = modelsForProv[0].id
  }
})

function applyCustomModel() {
  if (customModelId.value.trim()) {
    store.llmSettings.model = customModelId.value.trim()
  }
}
const newCustomMcp = ref({ name: '', icon: '', cmd: '' })

function getModelQuota(acc: any, modelName: string) {
  if (!acc.quota) return null
  return acc.quota.find((m: any) => m.name === modelName)
}

function formatDate(isoStr: string) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return isoStr
  return `(${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')})`
}

const refreshingCockpit = ref(false)
async function refreshCockpit() {
  refreshingCockpit.value = true
  try {
    await store.checkCockpit()
    addToast('Stato Cockpit Tools aggiornato', 'success')
  } catch (err) {
    addToast('Impossibile verificare Cockpit Tools', 'error')
  } finally {
    refreshingCockpit.value = false
  }
}

function saveCustomMcp() {
  if (!newCustomMcp.value.name || !newCustomMcp.value.cmd) return
  if (!store.llmSettings.customCatalog) {
    store.llmSettings.customCatalog = []
  }
  store.llmSettings.customCatalog.push({ ...newCustomMcp.value })
  newCustomMcp.value = { name: '', icon: '', cmd: '' }
  showCustomCatalogForm.value = false
}

const mcpCatalog = [
  { name: 'Brave Search', cmd: 'npx -y @modelcontextprotocol/server-brave-search', desc: 'Ricerca Web (richiede BRAVE_API_KEY)', icon: '🔍' },
  { name: 'GitHub', cmd: 'npx -y @modelcontextprotocol/server-github', desc: 'Gestione Repository & API GitHub', icon: '🐙' },
  { name: 'File System', cmd: 'npx -y @modelcontextprotocol/server-filesystem /', desc: 'Accesso ai file locali', icon: '📁' },
  { name: 'SQLite', cmd: 'npx -y @modelcontextprotocol/server-sqlite --db /path/to/db', desc: 'Database SQL', icon: '🗄️' },
  { name: 'PostgreSQL', cmd: 'npx -y @modelcontextprotocol/server-postgres postgres://localhost/db', desc: 'Database PostgreSQL', icon: '🐘' },
  { name: 'Puppeteer', cmd: 'npx -y @modelcontextprotocol/server-puppeteer', desc: 'Automazione Browser', icon: '🌐' },
  { name: 'Google Drive', cmd: 'npx -y @modelcontextprotocol/server-gdrive', desc: 'Google Drive API', icon: '📂' },
  { name: 'Slack', cmd: 'npx -y @modelcontextprotocol/server-slack', desc: 'Slack API', icon: '💬' },
  { name: 'Notion', cmd: 'npx -y @modelcontextprotocol/server-notion', desc: 'Notion API', icon: '📝' },
  { name: 'Sentry', cmd: 'npx -y @modelcontextprotocol/server-sentry', desc: 'Sentry Error Tracking', icon: '🐛' },
  { name: 'Memory', cmd: 'npx -y @modelcontextprotocol/server-memory', desc: 'Agent Memory System', icon: '🧠' },
  { name: 'Sequential', cmd: 'npx -y @modelcontextprotocol/server-sequential-thinking', desc: 'Sequential Thinking logic', icon: '⚙️' },
  { name: 'Fetch', cmd: 'npx -y @modelcontextprotocol/server-fetch', desc: 'Lettura contenuti web (URL → testo)', icon: '🌍' },
  { name: 'Everything', cmd: 'npx -y @modelcontextprotocol/server-everything', desc: 'Server di test/riferimento MCP completo', icon: '🧪' },
  { name: 'Google Maps', cmd: 'npx -y @modelcontextprotocol/server-google-maps', desc: 'Geocoding, indicazioni stradali, POI', icon: '🗺️' },
  { name: 'Time', cmd: 'npx -y @modelcontextprotocol/server-time', desc: 'Fuso orario e conversione ora', icon: '🕐' },
  { name: 'EverArt', cmd: 'npx -y @modelcontextprotocol/server-everart', desc: 'Generazione immagini AI', icon: '🎨' },
  { name: 'Stripe', cmd: 'npx -y @stripe/mcp', desc: 'Integrazione pagamenti e fatturazione Stripe', icon: '💳' },
  { name: 'Twilio', cmd: 'npx -y @modelcontextprotocol/server-twilio', desc: 'Invio SMS e chiamate API', icon: '📱' },
  { name: 'SendGrid', cmd: 'npx -y @modelcontextprotocol/server-sendgrid', desc: 'Email transazionali SendGrid', icon: '📧' },
  { name: 'Cockpit Tools', cmd: 'npx -y cockpit-tools-mcp', desc: 'Strumenti di debug e monitoraggio Cockpit AI', icon: '✈️' },
  { name: 'OpenAPI / Swagger', cmd: 'npx -y @modelcontextprotocol/server-openapi', desc: 'Connessione a qualsiasi API REST con spec OpenAPI', icon: '🔌' }
]

function addMcpServer(cmd: string) {
  if (!store.llmSettings.mcpServers) {
    store.llmSettings.mcpServers = []
  }
  // Remove trailing spaces or duplicates based on package name
  const cleanCmd = cmd.trim()
  const exists = store.llmSettings.mcpServers.some(s => s.trim() === cleanCmd || (cleanCmd.includes('server-') && s.includes(cleanCmd.split(' ').find(w => w.includes('server-')) || 'xyz')))
  if (!exists && cleanCmd) {
    store.llmSettings.mcpServers.push(cleanCmd)
  }
}

async function saveSettings() {
  try {
    error.value = ''
    if (store.settings.delayMin >= store.settings.delayMax) {
      error.value = 'Il ritardo minimo deve essere minore del ritardo massimo.'
      return
    }
    await store.saveSettings()
  } catch (err: any) {
    error.value = err.message || 'Errore durante il salvataggio'
  }
}

onMounted(async () => {
  store.fetchSettings()
  try {
    const res = await $fetch('/api/settings/cockpit')
    if (res && res.data) {
      cockpitStatus.value = res.data
    }
  } catch (e) {
    console.error("Cockpit Tools check failed", e)
  }
})
</script>
