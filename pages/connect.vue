<template>
  <div class="p-8 h-full flex flex-col items-center justify-center relative">
    <!-- Success Overlay -->
    <Teleport to="body">
      <Transition name="success-overlay">
        <div v-if="showSuccess" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div class="flex flex-col items-center gap-6 animate-bounce-in">
            <!-- Animated checkmark -->
            <div class="relative">
              <div class="w-28 h-28 rounded-full bg-primary/20 flex items-center justify-center animate-pulse-ring">
                <div class="w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(37,211,102,0.6)]">
                  <CheckCircle2 class="w-10 h-10 text-white animate-scale-in" />
                </div>
              </div>
              <!-- Particle effects -->
              <div class="absolute -top-2 -left-2 w-3 h-3 bg-primary rounded-full animate-particle-1"></div>
              <div class="absolute -top-1 -right-3 w-2 h-2 bg-tertiary rounded-full animate-particle-2"></div>
              <div class="absolute -bottom-2 -left-3 w-2.5 h-2.5 bg-secondary rounded-full animate-particle-3"></div>
              <div class="absolute -bottom-1 -right-2 w-2 h-2 bg-primary rounded-full animate-particle-4"></div>
              <div class="absolute top-1/2 -left-6 w-1.5 h-1.5 bg-tertiary rounded-full animate-particle-5"></div>
              <div class="absolute top-1/2 -right-6 w-2 h-2 bg-primary rounded-full animate-particle-6"></div>
            </div>

            <div class="text-center space-y-2">
              <h2 class="text-2xl font-bold text-white">{{ t('connect.success_title') }}</h2>
              <p class="text-white/70 text-sm">{{ t('connect.success_message') }}</p>
            </div>

            <!-- Device Info Card -->
            <div v-if="localPhone || localEngine" class="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5 min-w-[280px] space-y-3">
              <div class="flex items-center gap-2 text-sm text-white/60 font-semibold uppercase tracking-wider">
                <Smartphone class="w-4 h-4" />
                {{ t('connect.device_connected') }}
              </div>
              <div v-if="localPhone" class="flex items-center justify-between">
                <span class="text-sm text-white/60">{{ t('connect.device_phone') }}</span>
                <span class="text-sm text-white font-mono font-semibold">+{{ localPhone }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-white/60">{{ t('connect.device_engine') }}</span>
                <span class="text-sm text-white font-semibold">{{ localEngine?.toUpperCase() }}</span>
              </div>
            </div>

            <p class="text-white/50 text-xs animate-pulse">{{ t('connect.success_redirecting') }}</p>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div class="max-w-4xl w-full bg-surface-container-low/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
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

          <!-- QR Validity Info -->
          <div v-if="!localConnected" class="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-lg">
            <Info class="w-4 h-4 text-primary shrink-0" />
            <p class="text-sm text-on-surface-variant">{{ t('connect.validity_info') }}</p>
          </div>
        </div>

        <!-- QR Code Side -->
        <div class="flex-1 flex flex-col items-center justify-center">
          <div class="relative w-72 h-72 bg-white rounded-xl p-4 shadow-xl mb-4">
            <!-- Loading Skeleton -->
            <div v-if="loadingQr" class="w-full h-full relative">
              <phantom-skeleton class="w-full h-full rounded-lg" base-color="#f1f5f9" highlight-color="#e2e8f0"></phantom-skeleton>
              <div class="absolute inset-0 border-4 border-primary/50 rounded-lg animate-pulse"></div>
              <!-- Scanner animation line -->
              <div class="absolute top-0 left-0 w-full h-1 bg-primary/80 shadow-[0_0_8px_2px_rgba(37,211,102,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
            </div>
            <!-- QR Code or Connected State -->
            <div v-else class="w-full h-full flex items-center justify-center rounded-lg overflow-hidden relative">
              <img v-if="qrCodeData" :src="qrCodeData" class="w-full h-full object-contain mix-blend-multiply" />
              <div v-else-if="localConnected" class="text-center text-emerald-600 flex flex-col items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span class="font-bold text-lg">{{ t('connect.connected') }}</span>
              </div>
              <div v-else class="text-gray-500 text-center">{{ t('connect.no_qr') }}</div>
            </div>

          </div>

          <!-- Countdown Progress Bar -->
          <div v-if="qrCodeData && !localConnected" class="w-72 mb-4">
            <div v-if="countdown > 0" class="space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs text-on-surface-variant">{{ t('connect.qr_expires_in', { seconds: countdown }) }}</span>
                <span class="text-xs font-bold tabular-nums" :class="countdown <= 5 ? 'text-red-400' : 'text-primary'">{{ countdown }}s</span>
              </div>
              <div class="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all duration-1000 ease-linear"
                     :class="countdown <= 5 ? 'bg-red-400' : 'bg-primary'"
                     :style="{ width: (countdown / QR_VALIDITY_SECONDS * 100) + '%' }"></div>
              </div>
            </div>
            <p v-else class="text-sm text-primary animate-pulse flex items-center justify-center gap-1.5">
              <RefreshCw class="w-3.5 h-3.5 animate-spin" />
              {{ t('connect.qr_expired') }}
            </p>
          </div>

          <button v-if="!localConnected" @click="reloadQr" class="px-6 py-3 bg-primary hover:bg-primary-fixed-dim text-surface font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] transition-all flex items-center gap-2">
            <RefreshCw class="w-5 h-5" :class="{ 'animate-spin': loadingQr }" />
            {{ t('connect.refresh') }}
          </button>
          <button v-else @click="disconnect" class="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {{ t('connect.disconnect') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from '#i18n'
import { useLocalePath } from '#i18n'
import { RefreshCw, CheckCircle2, Smartphone, Info } from 'lucide-vue-next'
import { useWhatsappStore } from '~/stores/whatsapp'

const { t } = useI18n()
const localePath = useLocalePath()
const waStore = useWhatsappStore()
const router = useRouter()

const loadingQr = ref(true)
const qrCodeData = ref<string | null>(null)
const showSuccess = ref(false)
const wasConnected = ref(false)

const tokenId = ref('')
const localConnected = ref(false)
const localPhone = ref('')
const localEngine = ref('')

// Countdown timer
const QR_VALIDITY_SECONDS = 20
const countdown = ref(QR_VALIDITY_SECONDS)

let pollInterval: any = null
let countdownInterval: any = null

const fetchQrCode = async () => {
  if (localConnected.value) {
    loadingQr.value = false
    qrCodeData.value = null
    return
  }
  
  loadingQr.value = true
  try {
    const res = await $fetch<{ data: { qrCode: string | null, tokenId: string } }>('/api/whatsapp/qr')
    qrCodeData.value = res.data?.qrCode || null
    if (res.data?.tokenId) {
      tokenId.value = res.data.tokenId
    }
    // Reset countdown on new QR
    if (qrCodeData.value) {
      startCountdown()
    }
  } catch (e) {
    qrCodeData.value = null
  } finally {
    loadingQr.value = false
  }
}

const startCountdown = () => {
  stopCountdown()
  countdown.value = QR_VALIDITY_SECONDS
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      stopCountdown()
      // Auto-refresh QR
      fetchQrCode()
    }
  }, 1000)
}

const stopCountdown = () => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
    countdownInterval = null
  }
}

const reloadQr = async () => {
  await fetchQrCode()
}

const disconnect = async () => {
  if (!tokenId.value) return
  try {
    await $fetch('/api/whatsapp/disconnect', { method: 'POST', body: { tokenId: tokenId.value } })
    localConnected.value = false
    localPhone.value = ''
    await waStore.fetchSessions()
    await fetchQrCode()
  } catch (e) {}
}

const pollStatus = async () => {
  if (!tokenId.value) return
  const prevConnected = localConnected.value
  
  try {
    const res = await $fetch<{ data: any }>(`/api/whatsapp/status?tokenId=${tokenId.value}`)
    localConnected.value = res.data.connected
    localPhone.value = res.data.phone
    localEngine.value = res.data.activeEngine
  } catch (e) {
    localConnected.value = false
  }
  
  // Detect transition: disconnected → connected
  if (!prevConnected && localConnected.value && !wasConnected.value) {
    wasConnected.value = true
    onConnectionSuccess()
  }
  
  if (localConnected.value) {
    qrCodeData.value = null
    stopCountdown()
  }
}

const onConnectionSuccess = () => {
  stopCountdown()
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
  
  waStore.fetchSessions()
  showSuccess.value = true
  
  // Redirect to devices page after 3 seconds
  setTimeout(() => {
    showSuccess.value = false
    router.push(localePath('/devices'))
  }, 3000)
}

onMounted(() => {
  wasConnected.value = localConnected.value
  fetchQrCode()
  
  // Poll status every 3 seconds to detect when user scans QR
  pollInterval = setInterval(() => {
    pollStatus()
  }, 3000)
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  stopCountdown()
})
</script>

<style scoped>
@keyframes scan {
  0%, 100% { top: 0; }
  50% { top: 100%; }
}

@keyframes bounce-in {
  0% { transform: scale(0.3); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.95); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes scale-in {
  0% { transform: scale(0); }
  80% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes pulse-ring {
  0% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.4); }
  70% { box-shadow: 0 0 0 20px rgba(37, 211, 102, 0); }
  100% { box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
}

@keyframes particle-1 {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(-30px, -40px) scale(0); opacity: 0; }
}
@keyframes particle-2 {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(35px, -35px) scale(0); opacity: 0; }
}
@keyframes particle-3 {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(-25px, 40px) scale(0); opacity: 0; }
}
@keyframes particle-4 {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(30px, 35px) scale(0); opacity: 0; }
}
@keyframes particle-5 {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(-40px, -10px) scale(0); opacity: 0; }
}
@keyframes particle-6 {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(40px, 10px) scale(0); opacity: 0; }
}

.animate-bounce-in { animation: bounce-in 0.6s ease-out; }
.animate-scale-in { animation: scale-in 0.5s ease-out 0.3s both; }
.animate-pulse-ring { animation: pulse-ring 2s ease-out infinite; }
.animate-particle-1 { animation: particle-1 0.8s ease-out 0.2s both; }
.animate-particle-2 { animation: particle-2 0.7s ease-out 0.3s both; }
.animate-particle-3 { animation: particle-3 0.9s ease-out 0.1s both; }
.animate-particle-4 { animation: particle-4 0.8s ease-out 0.4s both; }
.animate-particle-5 { animation: particle-5 0.7s ease-out 0.25s both; }
.animate-particle-6 { animation: particle-6 0.85s ease-out 0.35s both; }

.success-overlay-enter-active { transition: opacity 0.4s ease; }
.success-overlay-leave-active { transition: opacity 0.6s ease; }
.success-overlay-enter-from,
.success-overlay-leave-to { opacity: 0; }
</style>
