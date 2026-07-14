<template>
  <div class="h-screen w-full flex overflow-hidden bg-[#faf9f5] dark:bg-[#141413] text-gray-900 dark:text-[#faf9f5] font-sans transition-colors duration-300">
    <CookieBanner />
    <!-- Toast Notifications -->
    <ClientOnly>
      <Teleport to="body">
        <TransitionGroup name="toast" tag="div" class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
          <div v-for="toast in toasts" :key="toast.id"
               class="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-xl animate-fade-in min-w-[300px] max-w-[420px]"
               :class="toast.type === 'success'
                 ? 'bg-primary/15 border-primary/30 text-primary'
                 : toast.type === 'error'
                   ? 'bg-error/15 border-error/30 text-error'
                   : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-gray-900 dark:text-white'">
            <CheckCircle2 v-if="toast.type === 'success'" class="w-5 h-5 shrink-0" />
            <AlertCircle v-else-if="toast.type === 'error'" class="w-5 h-5 shrink-0" />
            <Info v-else class="w-5 h-5 shrink-0" />
            <span class="text-sm font-medium">{{ toast.message }}</span>
            <button @click="removeToast(toast.id)" class="ml-auto p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0">
              <X class="w-3.5 h-3.5" />
            </button>
          </div>
        </TransitionGroup>
      </Teleport>
    </ClientOnly>

    <!-- Sidebar Overlay (Mobile) -->
    <div v-if="isSidebarOpen" @click="isSidebarOpen = false" class="md:hidden fixed inset-0 bg-black/50 z-20 backdrop-blur-sm animate-fade-in"></div>

    <!-- Sidebar -->
    <Transition
      enter-active-class="transition-transform duration-300 ease-out"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform duration-300 ease-in"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <aside v-show="isSidebarOpen" class="w-[280px] shrink-0 bg-[#f0eee5] dark:bg-[#1a1a19] border-r border-black/5 dark:border-white/5 flex flex-col justify-between absolute md:relative z-30 h-full shadow-2xl md:shadow-none">
        <div class="p-5 flex items-center justify-between">
          <h1 class="text-xl font-heading font-bold text-primary tracking-tighter">WaForge</h1>
          <button @click="isSidebarOpen = false" class="md:hidden p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <X class="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-3 space-y-6 scrollbar-hide">
          <!-- Team/User Info -->
          <div v-if="authStore.user" class="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between">
            <div class="overflow-hidden">
              <p class="text-sm font-heading font-semibold text-gray-900 dark:text-white truncate">{{ authStore.currentTeam?.name || 'Workspace' }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ authStore.user?.email }}</p>
            </div>
          </div>

          <nav class="space-y-1">
            <p class="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Platform</p>
            <NuxtLink :to="localePath('/')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" exact-active-class="bg-primary/10 text-primary font-medium">
              <LayoutDashboard class="w-5 h-5" />
              <span class="text-sm">{{ t('nav.home') }}</span>
            </NuxtLink>
            <NuxtLink :to="localePath('/devices')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary font-medium">
              <Smartphone class="w-5 h-5" />
              <span class="text-sm">{{ t('nav.devices') }}</span>
              <span v-if="!waStore.connected" class="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Dispositivo WA non connesso"></span>
            </NuxtLink>
            
            <NuxtLink :to="localePath('/contacts')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary font-medium">
              <Users class="w-5 h-5" />
              <span class="text-sm">{{ t('nav.contacts') }}</span>
            </NuxtLink>
            <NuxtLink :to="localePath('/campaigns')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary font-medium">
              <Megaphone class="w-5 h-5" />
              <span class="text-sm">{{ t('nav.campaigns') }}</span>
            </NuxtLink>
            <NuxtLink :to="localePath('/templates')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary font-medium">
              <MessageSquareText class="w-5 h-5" />
              <span class="text-sm">{{ t('nav.templates') }}</span>
            </NuxtLink>
            <NuxtLink :to="localePath('/chat')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary font-medium">
              <MessageCircle class="w-5 h-5" />
              <span class="text-sm">Workspace AI</span>
              <span v-if="!waStore.connected" class="ml-auto w-2 h-2 rounded-full bg-amber-500" title="Dispositivo WA non connesso"></span>
            </NuxtLink>
          </nav>
        </div>

        <div class="p-4 border-t border-black/5 dark:border-white/5 space-y-2">
          <!-- Theme & Lang -->
          <div class="flex items-center justify-between mb-4 px-2">
            <ClientOnly>
              <button @click="toggleColorMode" class="p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <Sun v-if="colorMode.value === 'dark'" class="w-4 h-4 text-gray-400" />
                <Moon v-else class="w-4 h-4 text-gray-400" />
              </button>
            </ClientOnly>
            <div class="flex gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg">
              <button @click="setLocale('en')" class="text-[10px] font-bold px-2 py-1 rounded transition-colors" :class="locale === 'en' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'">EN</button>
              <button @click="setLocale('it')" class="text-[10px] font-bold px-2 py-1 rounded transition-colors" :class="locale === 'it' ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'">IT</button>
            </div>
          </div>

          <nav class="space-y-1">
            <NuxtLink :to="localePath('/settings')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-400" active-class="text-primary font-medium bg-primary/5">
              <Settings class="w-4 h-4" />
              <span class="text-sm">Settings</span>
            </NuxtLink>
            <button @click="authStore.logout" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
              <LogOut class="w-4 h-4" />
              <span class="text-sm">Logout</span>
            </button>
          </nav>
        </div>
      </aside>
    </Transition>

    <!-- Main Content Area -->
    <main class="flex-1 flex flex-col min-w-0 relative h-full">
      <!-- Chat-Centric Top Bar -->
      <header class="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-black/5 dark:border-white/5 bg-[#faf9f5]/80 dark:bg-[#141413]/80 backdrop-blur-xl z-10 sticky top-0">
        <button @click="isSidebarOpen = !isSidebarOpen" class="p-2 -ml-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group" title="Toggle Sidebar">
          <PanelLeft class="w-5 h-5 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
        </button>
        <div class="flex items-center gap-2">
          <h2 class="font-heading font-semibold text-sm">WaForge Co-Pilot</h2>
          <span class="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold tracking-widest uppercase animate-pulse-slow">Beta</span>
        </div>
      </header>

      <!-- Slot content -->
      <div class="flex-1 overflow-auto relative scroll-smooth flex flex-col">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, provide } from 'vue'
import { LayoutDashboard, Users, Megaphone, Settings, Activity, Sun, Moon, LogOut, MessageSquareText, MessageCircle, Lock, CheckCircle2, AlertCircle, Info, X, PanelLeft, Smartphone } from 'lucide-vue-next'
import { useI18n, useLocalePath } from '#i18n'
import { useColorMode } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useWhatsappStore } from '~/stores/whatsapp'

const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const colorMode = useColorMode()
const authStore = useAuthStore()
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

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

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

.toast-enter-active, .toast-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.toast-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
