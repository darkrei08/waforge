<template>
  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="-translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-300 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="-translate-x-full"
  >
    <aside v-show="isSidebarOpen" class="w-[280px] shrink-0 glass-panel !rounded-none !border-y-0 !border-l-0 flex flex-col justify-between absolute md:relative z-30 h-full shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.2)]">
      <div class="p-5 flex items-center justify-between">
        <h1 class="text-xl font-heading font-bold text-primary tracking-tighter">WaForge</h1>
        <button @click="$emit('update:isSidebarOpen', false)" class="md:hidden p-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <X class="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-3 space-y-6 scrollbar-hide">
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
          <NuxtLink v-if="hasWaFeature" :to="localePath('/devices')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary font-medium">
            <Smartphone class="w-5 h-5" />
            <span class="text-sm">{{ t('nav.devices') }}</span>
            <span v-if="!waStore.connected" class="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Dispositivo WA non connesso"></span>
          </NuxtLink>
          <NuxtLink :to="localePath('/contacts')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary font-medium">
            <Users class="w-5 h-5" />
            <span class="text-sm">{{ t('nav.contacts') }}</span>
          </NuxtLink>
          <NuxtLink :to="localePath('/crm')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary font-medium">
            <KanbanSquare class="w-5 h-5" />
            <span class="text-sm">CRM Pipeline</span>
          </NuxtLink>
          <NuxtLink v-if="hasWaFeature" :to="localePath('/campaigns')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary font-medium">
            <Megaphone class="w-5 h-5" />
            <span class="text-sm">{{ t('nav.campaigns') }}</span>
          </NuxtLink>
          <NuxtLink :to="localePath('/templates')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary font-medium">
            <MessageSquareText class="w-5 h-5" />
            <span class="text-sm">{{ t('nav.templates') }}</span>
          </NuxtLink>
          <NuxtLink v-if="hasWaFeature" :to="localePath('/chat')" class="flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors" active-class="bg-primary/10 text-primary font-medium">
            <MessageCircle class="w-5 h-5" />
            <span class="text-sm">Workspace AI</span>
            <span v-if="!waStore.connected" class="ml-auto w-2 h-2 rounded-full bg-amber-500" title="Dispositivo WA non connesso"></span>
          </NuxtLink>
        </nav>
      </div>

      <div class="p-4 border-t border-black/5 dark:border-white/5 space-y-2">
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
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LayoutDashboard, Users, Megaphone, Settings, Sun, Moon, LogOut, MessageSquareText, MessageCircle, X, Smartphone, KanbanSquare } from 'lucide-vue-next'
import { useI18n, useLocalePath } from '#i18n'
import { useColorMode } from '#imports'
import { useAuthStore } from '~/stores/auth'
import { useWhatsappStore } from '~/stores/whatsapp'

defineProps<{ isSidebarOpen: boolean }>()
defineEmits(['update:isSidebarOpen'])

const { t, locale, setLocale } = useI18n()
const localePath = useLocalePath()
const colorMode = useColorMode()
const authStore = useAuthStore()
const waStore = useWhatsappStore()

const hasWaFeature = computed(() => {
  return authStore.currentTeam?.activeFeatures?.includes('waforge.campaigns')
})

const toggleColorMode = () => {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
</style>
