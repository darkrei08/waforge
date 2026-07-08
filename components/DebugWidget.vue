<template>
  <div v-if="isOpen" ref="widgetRef" :style="style" class="fixed z-[9999] w-[400px] bg-surface-container-high/95 backdrop-blur-xl border border-error/30 rounded-xl shadow-2xl flex flex-col font-sans select-none">
    <!-- Header -->
    <div ref="handleRef" class="px-4 py-2 bg-error/10 border-b border-error/30 flex justify-between items-center cursor-move rounded-t-xl" @dblclick="isCollapsed = !isCollapsed">
      <div class="flex items-center gap-2">
        <Bug class="w-4 h-4 text-error" />
        <span class="font-bold text-sm text-error">WaForge Debugger</span>
      </div>
      <div class="flex gap-3 items-center">
        <span class="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)] animate-pulse"></span>
        <button @click="isOpen = false" class="text-error hover:text-red-400">
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Body -->
    <div v-show="!isCollapsed" class="flex flex-col h-[450px]">
      
      <!-- Tabs -->
      <div class="flex border-b border-white/10 bg-black/20">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="flex-1 py-2 text-xs font-medium uppercase tracking-wider transition-colors border-b-2"
          :class="activeTab === tab.id ? 'text-primary border-primary bg-white/5' : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- Tab Content: Logs -->
      <div v-if="activeTab === 'logs'" class="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        <div class="flex gap-2 shrink-0">
          <button @click="mockConnect" class="flex-1 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary text-xs font-medium rounded border border-primary/30 transition-colors">
            Mock Connect
          </button>
          <button @click="disconnect" class="flex-1 px-3 py-1.5 bg-error/20 hover:bg-error/30 text-error text-xs font-medium rounded border border-error/30 transition-colors">
            Disconnect
          </button>
        </div>
        
        <div class="flex-1 bg-[#0a0a0a] rounded border border-white/5 p-3 overflow-y-auto font-mono text-[11px] text-green-400 space-y-1.5 custom-scrollbar">
          <div v-for="(log, i) in logs" :key="i" class="opacity-80 hover:opacity-100 hover:bg-white/5 px-1 -mx-1 rounded transition-colors break-words">
            <span class="text-gray-500 mr-2">[{{ log.time }}]</span>
            <span :class="log.level === 'error' ? 'text-red-400' : (log.level === 'warn' ? 'text-yellow-400' : 'text-green-400')">{{ log.msg }}</span>
          </div>
        </div>
        
        <button @click="logs = []" class="w-full py-1 text-[11px] text-gray-500 hover:text-gray-300 transition-colors shrink-0">
          Clear Logs
        </button>
      </div>

      <!-- Tab Content: Pinia State -->
      <div v-if="activeTab === 'state'" class="flex-1 bg-[#0a0a0a] m-3 rounded border border-white/5 p-3 overflow-y-auto font-mono text-[11px] text-blue-300 custom-scrollbar">
        <pre class="whitespace-pre-wrap">{{ stateSnapshot }}</pre>
      </div>

      <!-- Tab Content: Network -->
      <div v-if="activeTab === 'network'" class="flex-1 flex flex-col p-3 overflow-hidden">
        <div class="flex-1 bg-[#0a0a0a] rounded border border-white/5 p-3 overflow-y-auto font-mono text-[11px] text-purple-300 custom-scrollbar">
           <div class="text-gray-500 italic mb-2">// Intercepted API requests (Mock)</div>
           <div v-for="req in networkRequests" :key="req.id" class="border-b border-white/5 py-1.5 last:border-0">
             <div class="flex justify-between text-[10px]">
               <span :class="req.method === 'GET' ? 'text-green-400' : 'text-yellow-400'">{{ req.method }}</span>
               <span :class="req.status >= 400 ? 'text-red-400' : 'text-gray-400'">{{ req.status }}</span>
             </div>
             <div class="text-purple-300 truncate">{{ req.url }}</div>
           </div>
        </div>
      </div>
      
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { Bug, X } from 'lucide-vue-next'
import { useDraggable, useWindowSize } from '@vueuse/core'
import { useAuthStore } from '~/stores/auth'

const isOpen = ref(true)
const isCollapsed = ref(false)

const widgetRef = ref<HTMLElement | null>(null)
const handleRef = ref<HTMLElement | null>(null)

// Initial position setup (bottom-right)
const { width, height } = useWindowSize()
const initialX = computed(() => width.value > 450 ? width.value - 424 : 24)
const initialY = computed(() => height.value > 600 ? height.value - (isCollapsed.value ? 60 : 520) : 24)

const { x, y, style } = useDraggable(widgetRef, {
  initialValue: { x: initialX.value, y: initialY.value },
  handle: handleRef,
})

// Tabs
const tabs = [
  { id: 'logs', label: 'Console' },
  { id: 'state', label: 'Pinia' },
  { id: 'network', label: 'Network' }
]
const activeTab = ref('logs')

// Pinia State
const authStore = useAuthStore()
const stateSnapshot = computed(() => {
  return JSON.stringify({
    auth: {
      isAuthenticated: authStore.isAuthenticated,
      currentTeam: authStore.currentTeam,
      user: authStore.user
    }
  }, null, 2)
})

// Logs
const logs = ref<{time: string, msg: string, level?: 'info'|'warn'|'error'}[]>([
  { time: new Date().toLocaleTimeString(), msg: 'Nitro Server Started', level: 'info' },
  { time: new Date().toLocaleTimeString(), msg: 'WuzAPI Engine initialized', level: 'info' }
])

// Network (Mock)
const networkRequests = ref([
  { id: 1, method: 'GET', url: '/api/auth/me', status: 200 },
  { id: 2, method: 'GET', url: '/api/stats/dashboard', status: 200 },
])

let logInterval: any = null

const fetchLogs = async () => {
  try {
    const data: any = await $fetch('/api/debug/logs')
    if (data && data.logs) {
      logs.value = data.logs
    }
  } catch (e) {
    // silently fail
  }
}

const mockConnect = () => {
  console.log('Simulating WhatsApp connection...')
}

const disconnect = async () => {
  try {
    const sessions: any = await $fetch('/api/whatsapp/sessions')
    const tokenId = sessions?.data?.[0]?.sessionId
    if (!tokenId) {
       console.error('No session to disconnect')
       return
    }
    await $fetch('/api/whatsapp/disconnect', { 
      method: 'POST',
      body: { tokenId }
    })
    console.log('Requested disconnect successfully')
  } catch (error) {
    console.error('Failed to disconnect', error)
  }
}

onMounted(() => {
  fetchLogs()
  // Poll for logs every 2s
  logInterval = setInterval(() => {
    fetchLogs()
  }, 2000)
})

onUnmounted(() => {
  if (logInterval) clearInterval(logInterval)
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
