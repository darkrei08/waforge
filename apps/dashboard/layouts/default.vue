<template>
  <div class="h-screen w-full flex overflow-hidden bg-surface text-on-surface font-sans transition-colors duration-300 relative z-0">
    <!-- Premium Glow Orbs -->
    <div class="fixed top-[-15%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>
    <div class="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
    <CookieBanner />
    
    <!-- Toast Notifications -->
    <AppToasts :toasts="toasts" @remove="removeToast" />

    <!-- Sidebar Overlay (Mobile) -->
    <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="md:hidden fixed inset-0 bg-black/50 z-20 backdrop-blur-sm animate-fade-in"></div>

    <!-- Sidebar -->
    <AppSidebar 
      :isSidebarOpen="isSidebarOpen" 
      @update:isSidebarOpen="isSidebarOpen = $event" 
    />

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col min-w-0 relative h-full">
      <!-- Chat-Centric Top Bar -->
      <AppHeader @toggleSidebar="isSidebarOpen = !isSidebarOpen" />

      <!-- Slot content -->
      <div class="flex-1 overflow-auto relative scroll-smooth flex flex-col">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, provide } from 'vue'
import { useI18n } from '#i18n'
import { useWhatsappStore } from '~/stores/whatsapp'

const { t } = useI18n()
const waStore = useWhatsappStore()

const isSidebarOpen = ref(true)

// Toast System
interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<Toast[]>([])
let toastId = 0

function addToast(message: string, type: Toast['type'] = 'info', duration = 4000) {
  const id = ++toastId
  toasts.value.push({ id, message, type })
  setTimeout(() => removeToast(id), duration)
}

function removeToast(id: number) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}

// Watch for WhatsApp connection changes to show toast
let prevConnected = false
watch(() => waStore.connected, (newVal) => {
  if (newVal && !prevConnected) {
    addToast(t('common.toast_connected'), 'success', 5000)
  }
  prevConnected = newVal
})

onMounted(() => {
  waStore.fetchSessions()
  prevConnected = waStore.connected
  
  // Auto collapse sidebar on mobile
  if (window.innerWidth < 768) {
    isSidebarOpen.value = false
  }
})

provide('addToast', addToast)
</script>

<style>
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}
</style>
