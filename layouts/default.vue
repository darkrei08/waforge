<template>
  <div class="min-h-screen bg-surface dark:bg-[#12161f] text-on-surface transition-colors duration-300 flex">
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
          <button @click="authStore.logout" class="p-2 hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg transition-colors" title="Logout">
            <LogOut class="w-4 h-4" />
          </button>
        </div>

        <nav class="space-y-2">
          <NuxtLink :to="localePath('/')" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors" exact-active-class="bg-primary/10 text-primary border-l-2 border-primary">
            <LayoutDashboard class="w-5 h-5" />
            <span class="font-medium text-sm">{{ t('nav.home') }}</span>
          </NuxtLink>
          <NuxtLink :to="localePath('/connect')" class="flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary border-l-2 border-primary">
            <div class="flex items-center gap-3">
              <QrCode class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('connect.title') }}</span>
            </div>
            <div class="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" :class="waStore.connected ? 'bg-primary shadow-primary/50' : 'bg-red-500 shadow-red-500/50'"></div>
          </NuxtLink>
          <NuxtLink :to="waStore.connected ? localePath('/contacts') : ''" class="flex items-center justify-between p-3 rounded-lg transition-colors" :class="waStore.connected ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'" :active-class="waStore.connected ? 'bg-primary/10 text-primary border-l-2 border-primary' : ''">
            <div class="flex items-center gap-3">
              <Users class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.contacts') }}</span>
            </div>
            <Lock v-if="!waStore.connected" class="w-4 h-4" />
          </NuxtLink>
          <NuxtLink :to="waStore.connected ? localePath('/campaigns') : ''" class="flex items-center justify-between p-3 rounded-lg transition-colors" :class="waStore.connected ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'" :active-class="waStore.connected ? 'bg-primary/10 text-primary border-l-2 border-primary' : ''">
            <div class="flex items-center gap-3">
              <Megaphone class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.campaigns') }}</span>
            </div>
            <Lock v-if="!waStore.connected" class="w-4 h-4" />
          </NuxtLink>
          <NuxtLink :to="waStore.connected ? localePath('/templates') : ''" class="flex items-center justify-between p-3 rounded-lg transition-colors" :class="waStore.connected ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'" :active-class="waStore.connected ? 'bg-primary/10 text-primary border-l-2 border-primary' : ''">
            <div class="flex items-center gap-3">
              <MessageSquareText class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.templates') }}</span>
            </div>
            <Lock v-if="!waStore.connected" class="w-4 h-4" />
          </NuxtLink>
          <NuxtLink :to="waStore.connected ? localePath('/chat') : ''" class="flex items-center justify-between p-3 rounded-lg transition-colors" :class="waStore.connected ? 'hover:bg-white/5' : 'opacity-50 cursor-not-allowed'" :active-class="waStore.connected ? 'bg-primary/10 text-primary border-l-2 border-primary' : ''">
            <div class="flex items-center gap-3">
              <MessageCircle class="w-5 h-5" />
              <span class="font-medium text-sm">{{ t('nav.chat') }}</span>
            </div>
            <Lock v-if="!waStore.connected" class="w-4 h-4" />
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
            <NuxtLink :to="switchLocalePath('en')" class="text-xs font-bold px-2 py-1 rounded" :class="locale === 'en' ? 'bg-primary text-surface' : 'text-gray-400 hover:text-white'">EN</NuxtLink>
            <NuxtLink :to="switchLocalePath('it')" class="text-xs font-bold px-2 py-1 rounded" :class="locale === 'it' ? 'bg-primary text-surface' : 'text-gray-400 hover:text-white'">IT</NuxtLink>
          </div>
        </div>

        <nav class="space-y-2">
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
import { onMounted } from 'vue'
import { LayoutDashboard, Users, Megaphone, Settings, Activity, QrCode, Sun, Moon, LogOut, MessageSquareText, MessageCircle, Lock } from 'lucide-vue-next'
import { useI18n, useLocalePath, useSwitchLocalePath } from '#i18n'
import { useColorMode } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useWhatsappStore } from '~/stores/whatsapp'

const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const colorMode = useColorMode()
const authStore = useAuthStore()
const waStore = useWhatsappStore()

onMounted(() => {
  waStore.fetchStatus()
})

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>
