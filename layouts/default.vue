<template>
  <div class="min-h-screen bg-surface dark:bg-[#12161f] text-on-surface transition-colors duration-300 flex">
    <!-- Toast Notifications -->
    <Teleport to="body">
      <TransitionGroup name="toast" tag="div" class="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <div v-for="toast in toasts" :key="toast.id"
             class="pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-xl border shadow-2xl backdrop-blur-xl animate-slide-in-right min-w-[300px] max-w-[420px]"
             :class="toast.type === 'success'
               ? 'bg-primary/15 border-primary/30 text-primary'
               : toast.type === 'error'
                 ? 'bg-error/15 border-error/30 text-error'
                 : 'bg-surface-container border-white/10 text-on-surface'">
          <CheckCircle2 v-if="toast.type === 'success'" class="w-5 h-5 shrink-0" />
          <AlertCircle v-else-if="toast.type === 'error'" class="w-5 h-5 shrink-0" />
          <Info v-else class="w-5 h-5 shrink-0" />
          <span class="text-sm font-medium">{{ toast.message }}</span>
          <button @click="removeToast(toast.id)" class="ml-auto p-1 rounded-full hover:bg-white/10 transition-colors shrink-0">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </Teleport>

    <!-- Sidebar -->
    <aside class="w-[280px] bg-surface-container/50 backdrop-blur-xl border-r border-black/5 dark:border-white/5 flex flex-col justify-between">
      <div class="p-6">
        <h1 class="text-xl font-bold text-primary mb-6 tracking-tighter">WaForge</h1>

        <!-- Team/User Info -->
        <div v-if="authStore.user" class="mb-8 p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between">
          <div class="overflow-hidden">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ authStore.currentTeam?.name || 'Workspace' }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ authStore.user?.email }}</p>
          </div>
          <button @click="authStore.logout" class="p-2 hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors" :title="t('common.logout')">
            <LogOut class="w-4 h-4" />
          </button>
        </div>

        <nav class="space-y-2">
          <NuxtLink :to="localePath('/')" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors" exact-active-class="bg-primary/10 text-primary border-l-2 border-primary">
            <LayoutDashboard class="w-5 h-5" />
            <span class="font-medium text-sm">{{ t('nav.home') }}</span>
          </NuxtLink>
          <a v-if="!waStore.connected" class="flex items-center justify-between p-3 rounded-lg transition-colors opacity-50 cursor-not-allowed">
            <div class="flex items-center gap-3">
              <Users class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.contacts') }}</span>
            </div>
            <Lock class="w-4 h-4" />
          </a>
          <NuxtLink v-else :to="localePath('/contacts')" class="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary border-l-2 border-primary">
            <div class="flex items-center gap-3">
              <Users class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.contacts') }}</span>
            </div>
          </NuxtLink>
          <a v-if="!waStore.connected" class="flex items-center justify-between p-3 rounded-lg transition-colors opacity-50 cursor-not-allowed">
            <div class="flex items-center gap-3">
              <Megaphone class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.campaigns') }}</span>
            </div>
            <Lock class="w-4 h-4" />
          </a>
          <NuxtLink v-else :to="localePath('/campaigns')" class="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary border-l-2 border-primary">
            <div class="flex items-center gap-3">
              <Megaphone class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.campaigns') }}</span>
            </div>
          </NuxtLink>
          <a v-if="!waStore.connected" class="flex items-center justify-between p-3 rounded-lg transition-colors opacity-50 cursor-not-allowed">
            <div class="flex items-center gap-3">
              <MessageSquareText class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.templates') }}</span>
            </div>
            <Lock class="w-4 h-4" />
          </a>
          <NuxtLink v-else :to="localePath('/templates')" class="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary border-l-2 border-primary">
            <div class="flex items-center gap-3">
              <MessageSquareText class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.templates') }}</span>
            </div>
          </NuxtLink>
          <a v-if="!waStore.connected" class="flex items-center justify-between p-3 rounded-lg transition-colors opacity-50 cursor-not-allowed">
            <div class="flex items-center gap-3">
              <MessageCircle class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.chat') }}</span>
            </div>
            <Lock class="w-4 h-4" />
          </a>
          <NuxtLink v-else :to="localePath('/chat')" class="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary border-l-2 border-primary">
            <div class="flex items-center gap-3">
              <MessageCircle class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.chat') }}</span>
            </div>
          </NuxtLink>
        </nav>
      </div>

      <div class="p-6 border-t border-black/5 dark:border-white/5 space-y-4">
        <!-- Theme & Lang Switcher -->
        <div class="flex items-center justify-between">
          <button @click="toggleColorMode" class="p-2 rounded-full hover:bg-white/5 transition-colors">
            <Sun v-if="colorMode.value === 'dark'" class="w-5 h-5 text-gray-400" />
            <Moon v-else class="w-5 h-5 text-gray-400" />
          </button>
          
          <div class="flex gap-2">
            <button @click="setLocale('en')" class="text-xs font-bold px-2 py-1 rounded transition-colors" :class="locale === 'en' ? 'bg-primary text-surface' : 'text-gray-400 hover:text-white'">EN</button>
            <button @click="setLocale('it')" class="text-xs font-bold px-2 py-1 rounded transition-colors" :class="locale === 'it' ? 'bg-primary text-surface' : 'text-gray-400 hover:text-white'">IT</button>
          </div>
        </div>

        <nav class="space-y-2">
          <NuxtLink :to="localePath('/devices')" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary">
            <Smartphone class="w-5 h-5" />
            <span class="font-medium text-sm">{{ t('nav.devices') }}</span>
          </NuxtLink>
          <NuxtLink :to="localePath('/team')" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary">
            <UserPlus class="w-5 h-5" />
            <span class="font-medium text-sm">{{ t('nav.team') }}</span>
          </NuxtLink>
          <NuxtLink :to="localePath('/profile')" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary">
            <UserCircle class="w-5 h-5" />
            <span class="font-medium text-sm">{{ t('nav.profile') || 'Profilo' }}</span>
          </NuxtLink>
          <NuxtLink :to="localePath('/settings')" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary">
            <Settings class="w-5 h-5" />
            <span class="font-medium text-sm">{{ t('nav.settings') }}</span>
          </NuxtLink>
          <NuxtLink :to="localePath('/api-status')" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary">
            <Activity class="w-5 h-5" />
            <span class="font-medium text-sm">{{ t('nav.api_status') }}</span>
          </NuxtLink>
        </nav>
      </div>
    </aside>

    <!-- Main Content Area -->
    <main class="flex-1 overflow-auto relative">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { LayoutDashboard, Users, Megaphone, Settings, Activity, QrCode, Sun, Moon, LogOut, MessageSquareText, MessageCircle, Lock, CheckCircle2, AlertCircle, Info, X, Smartphone, UserPlus, UserCircle } from 'lucide-vue-next'
import { useI18n, useLocalePath } from '#i18n'
import { useColorMode } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useWhatsappStore } from '~/stores/whatsapp'

const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const colorMode = useColorMode()
const authStore = useAuthStore()
const waStore = useWhatsappStore()

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
})

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

// Expose toast function globally via provide
provide('addToast', addToast)
</script>

<style>
@keyframes slide-in-right {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

.animate-slide-in-right {
  animation: slide-in-right 0.35s ease-out;
}

.toast-enter-active {
  animation: slide-in-right 0.35s ease-out;
}

.toast-leave-active {
  transition: all 0.3s ease-in;
}

.toast-leave-to {
  transform: translateX(120%);
  opacity: 0;
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
