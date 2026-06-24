<template>
  <div class="p-8 h-full flex flex-col items-center justify-center relative">
    <div class="max-w-4xl w-full bg-surface-container-low/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      <!-- Glow effect -->
      <div class="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none"></div>

      <div class="flex flex-col md:flex-row gap-12 items-center">
        <!-- Instructions Side -->
        <div class="flex-1 space-y-6">
          <div>
            <h2 class="text-3xl font-bold text-on-surface mb-2 tracking-tight">{{ t('connect.title') }}</h2>
            <p class="text-on-surface-variant">{{ t('connect.waiting') }}</p>
          </div>

          <div class="space-y-4">
            <div class="flex gap-4 items-start">
              <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">1</div>
              <p class="text-on-surface text-lg pt-1">{{ t('connect.instructions.step_1') }}</p>
            </div>
            <div class="flex gap-4 items-start">
              <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">2</div>
              <p class="text-on-surface text-lg pt-1">{{ t('connect.instructions.step_2') }}</p>
            </div>
            <div class="flex gap-4 items-start">
              <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">3</div>
              <p class="text-on-surface text-lg pt-1">{{ t('connect.instructions.step_3') }}</p>
            </div>
            <div class="flex gap-4 items-start">
              <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">4</div>
              <p class="text-on-surface text-lg pt-1">{{ t('connect.instructions.step_4') }}</p>
            </div>
          </div>
        </div>

        <!-- QR Code Side -->
        <div class="flex-1 flex flex-col items-center justify-center">
          <div class="relative w-72 h-72 bg-white rounded-xl p-4 shadow-xl mb-6">
            <!-- Phantom UI Skeleton or QR -->
            <div v-if="loadingQr" class="w-full h-full relative">
              <phantom-skeleton class="w-full h-full rounded-lg" base-color="#f1f5f9" highlight-color="#e2e8f0"></phantom-skeleton>
              <div class="absolute inset-0 border-4 border-primary/50 rounded-lg animate-pulse"></div>
              <!-- Scanner animation line -->
              <div class="absolute top-0 left-0 w-full h-1 bg-primary/80 shadow-[0_0_8px_2px_rgba(37,211,102,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
            <div v-else class="w-full h-full flex items-center justify-center rounded-lg overflow-hidden relative">
              <img v-if="qrCodeData" :src="qrCodeData" class="w-full h-full object-contain mix-blend-multiply" />
              <div v-else-if="waStore.connected" class="text-center text-emerald-600 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-bold text-lg">Connesso!</span>
              </div>
              <div v-else class="text-gray-500 text-center">Nessun QR Code disponibile</div>
            </div>
          </div>

          <button v-if="!waStore.connected" @click="reloadQr" class="px-6 py-3 bg-primary hover:bg-primary-fixed-dim text-surface font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all flex items-center gap-2">
            <RefreshCw class="w-5 h-5" :class="{ 'animate-spin': loadingQr }" />
            {{ t('connect.refresh') }}
          </button>
          <button v-else @click="disconnect" class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Disconnetti
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from '#i18n'
import { RefreshCw } from 'lucide-vue-next'
import { useWhatsappStore } from '~/stores/whatsapp'

const { t } = useI18n()
const waStore = useWhatsappStore()

const loadingQr = ref(true)
const qrCodeData = ref<string | null>(null)
let pollInterval: any = null

const fetchQrCode = async () => {
  if (waStore.connected) {
    loadingQr.value = false
    qrCodeData.value = null
    return
  }
  
  loadingQr.value = true
  try {
    const res = await $fetch<{ data: { qrCode: string | null } }>('/api/whatsapp/qr')
    qrCodeData.value = res.data?.qrCode || null
  } catch (e) {
    qrCodeData.value = null
  } finally {
    loadingQr.value = false
  }
}

const reloadQr = async () => {
  await fetchQrCode()
}

const disconnect = async () => {
  try {
    await $fetch('/api/whatsapp/disconnect', { method: 'POST' })
    await waStore.fetchStatus()
    await fetchQrCode()
  } catch (e) {}
}

const pollStatus = async () => {
  await waStore.fetchStatus()
  if (waStore.connected) {
    qrCodeData.value = null
  }
}

onMounted(() => {
  fetchQrCode()
  pollStatus()
  // Poll status every 5 seconds to detect when user scans QR
  pollInterval = setInterval(() => {
    pollStatus()
  }, 5000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
})
</script>

<style scoped>
@keyframes scan {
  0%, 100% { top: 0; }
  50% { top: 100%; }
}
</style>
