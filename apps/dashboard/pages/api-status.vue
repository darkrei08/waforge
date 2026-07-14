<template>
  <div class="p-8 space-y-6 animate-fade-in">
    <h1 class="text-3xl font-bold text-on-surface tracking-tight">{{ t('nav.api_status') }}</h1>

    <!-- Engine Status Card -->
    <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 relative overflow-hidden">
      <div class="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[80px] pointer-events-none"
           :class="waStore.connected ? 'bg-primary/20' : 'bg-error/20'"></div>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-xl flex items-center justify-center"
               :class="waStore.connected ? 'bg-primary/10' : 'bg-error/10'">
            <Wifi class="w-7 h-7" :class="waStore.connected ? 'text-primary' : 'text-error'" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-on-surface">{{ t('api_status.engine_title') }}</h2>
            <p class="text-sm text-on-surface-variant">{{ (waStore.engine || 'WuzAPI').toUpperCase() }} — {{ waStore.connected ? t('api_status.status_connected') : t('api_status.status_disconnected') }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="w-3 h-3 rounded-full" :class="waStore.connected
            ? 'bg-primary shadow-[0_0_10px_rgba(37,211,102,0.8)] animate-glow-pulse'
            : 'bg-error shadow-[0_0_10px_rgba(255,59,48,0.8)]'"></span>
          <span class="text-sm font-semibold" :class="waStore.connected ? 'text-primary' : 'text-error'">
            {{ waStore.connected ? t('api_status.online') : t('api_status.offline') }}
          </span>
        </div>
      </div>
      <div v-if="waStore.phone" class="mt-4 p-3 bg-white/5 rounded-lg">
        <p class="text-sm text-on-surface-variant">{{ t('api_status.phone_label') }}: <span class="text-on-surface font-mono">+{{ waStore.phone }}</span></p>
      </div>
    </div>

    <!-- Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div v-for="metric in metrics" :key="metric.label"
           class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-5">
        <div class="flex items-center gap-2 mb-2">
          <component :is="metric.icon" class="w-4 h-4 text-on-surface-variant" />
          <span class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{{ metric.label }}</span>
        </div>
        <p class="text-2xl font-bold text-on-surface">{{ metric.value }}</p>
      </div>
    </div>

    <!-- Live Log Terminal -->
    <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      <div class="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Terminal class="w-4 h-4 text-primary" />
          <span class="text-sm font-semibold text-on-surface">{{ t('api_status.logs_title') }}</span>
        </div>
        <button @click="logs = []" class="text-xs text-on-surface-variant hover:text-on-surface transition-colors">
          {{ t('api_status.logs_clear') }}
        </button>
      </div>
      <div ref="logContainer" class="h-64 overflow-y-auto p-4 font-mono text-xs space-y-1 bg-black/30">
        <div v-for="(log, i) in logs" :key="i" class="opacity-80 hover:opacity-100 transition-opacity">
          <span class="text-on-surface-variant/50">[{{ log.time }}]</span>
          <span :class="log.level === 'error' ? 'text-error' : log.level === 'warn' ? 'text-yellow-400' : 'text-primary'">
            {{ log.msg }}
          </span>
        </div>
        <div v-if="!logs.length" class="text-on-surface-variant/50">{{ t('api_status.logs_waiting') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { Wifi, Terminal, Clock, Cpu, HardDrive } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useWhatsappStore } from '~/stores/whatsapp'

const { t } = useI18n()
const waStore = useWhatsappStore()

const logContainer = ref<HTMLElement | null>(null)
const logs = ref<{ time: string; msg: string; level: string }[]>([])
const startTime = Date.now()

const metrics = ref([
  { label: t('api_status.uptime'), value: '0s', icon: Clock },
  { label: t('api_status.engine'), value: (waStore.engine || 'WuzAPI').toUpperCase(), icon: Cpu },
  { label: t('api_status.db_size'), value: '—', icon: HardDrive },
])

let statusInterval: ReturnType<typeof setInterval>
let logInterval: ReturnType<typeof setInterval>

function addLog(msg: string, level = 'info') {
  logs.value.push({ time: new Date().toLocaleTimeString(), msg, level })
  if (logs.value.length > 200) logs.value.shift()
  nextTick(() => {
    if (logContainer.value) logContainer.value.scrollTop = logContainer.value.scrollHeight
  })
}

function formatUptime(ms: number) {
  const s = Math.floor(ms / 1000)
  if (s < 60) return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

onMounted(() => {
  waStore.fetchStatus()
  addLog(t('api_status.logs_init'))
  addLog(t('api_status.logs_engine', { engine: waStore.engine }))

  statusInterval = setInterval(async () => {
    await waStore.fetchStatus()
    metrics.value[0].value = formatUptime(Date.now() - startTime)
    metrics.value[1].value = waStore.engine.toUpperCase()
    addLog(waStore.connected ? t('api_status.logs_health_ok') : t('api_status.logs_health_fail'), waStore.connected ? 'info' : 'warn')
  }, 5000)
})

onUnmounted(() => {
  clearInterval(statusInterval)
  if (logInterval) clearInterval(logInterval)
})
</script>
