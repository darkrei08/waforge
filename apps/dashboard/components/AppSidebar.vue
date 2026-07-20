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

      <div class="flex-1 overflow-y-auto px-3 space-y-2 scrollbar-hide">
        <!-- Workspace Info Card -->
        <div v-if="authStore.user" class="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 flex items-center justify-between mb-3">
          <div class="overflow-hidden">
            <p class="text-sm font-heading font-semibold text-gray-900 dark:text-white truncate">{{ authStore.currentTeam?.name || 'Workspace' }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ authStore.user?.email }}</p>
          </div>
          <span v-if="currentRole" class="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0"
                :class="currentRole === 'OWNER' ? 'bg-primary/20 text-primary' : currentRole === 'ADMIN' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/50'">
            {{ currentRole }}
          </span>
        </div>

        <!-- PLATFORM SECTION -->
        <div>
          <button @click="sections.platform = !sections.platform" class="w-full flex items-center justify-between px-3 py-2 group">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Platform</p>
            <ChevronDown class="w-3.5 h-3.5 text-gray-500 transition-transform duration-200" :class="{ 'rotate-180': !sections.platform }" />
          </button>
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[500px]"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 max-h-[500px]"
            leave-to-class="opacity-0 max-h-0"
          >
            <nav v-show="sections.platform" class="space-y-0.5 overflow-hidden">
              <NuxtLink :to="localePath('/')" class="sidebar-link" exact-active-class="sidebar-link-active">
                <LayoutDashboard class="w-5 h-5" />
                <span class="text-sm">{{ t('nav.home') }}</span>
              </NuxtLink>
              <NuxtLink v-if="hasWaFeature" :to="localePath('/devices')" class="sidebar-link" active-class="sidebar-link-active">
                <Smartphone class="w-5 h-5" />
                <span class="text-sm">{{ t('nav.devices') }}</span>
                <span v-if="!waStore.connected" class="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Dispositivo WA non connesso"></span>
              </NuxtLink>
              <NuxtLink :to="localePath('/contacts')" class="sidebar-link" active-class="sidebar-link-active">
                <Users class="w-5 h-5" />
                <span class="text-sm">{{ t('nav.contacts') }}</span>
              </NuxtLink>
              <NuxtLink :to="localePath('/crm')" class="sidebar-link" active-class="sidebar-link-active">
                <KanbanSquare class="w-5 h-5" />
                <span class="text-sm">CRM Pipeline</span>
              </NuxtLink>
              <NuxtLink v-if="hasWaFeature" :to="localePath('/campaigns')" class="sidebar-link" active-class="sidebar-link-active">
                <Megaphone class="w-5 h-5" />
                <span class="text-sm">{{ t('nav.campaigns') }}</span>
              </NuxtLink>
              <NuxtLink :to="localePath('/templates')" class="sidebar-link" active-class="sidebar-link-active">
                <MessageSquareText class="w-5 h-5" />
                <span class="text-sm">{{ t('nav.templates') }}</span>
              </NuxtLink>
              <NuxtLink v-if="hasWaFeature" :to="localePath('/chat')" class="sidebar-link" active-class="sidebar-link-active">
                <MessageCircle class="w-5 h-5" />
                <span class="text-sm">Workspace AI</span>
                <span v-if="!waStore.connected" class="ml-auto w-2 h-2 rounded-full bg-amber-500" title="Dispositivo WA non connesso"></span>
              </NuxtLink>
            </nav>
          </Transition>
        </div>

        <!-- ACCOUNT & BILLING SECTION -->
        <div>
          <button @click="sections.account = !sections.account" class="w-full flex items-center justify-between px-3 py-2 group">
            <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account & Billing</p>
            <ChevronDown class="w-3.5 h-3.5 text-gray-500 transition-transform duration-200" :class="{ 'rotate-180': !sections.account }" />
          </button>
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 max-h-0"
            enter-to-class="opacity-100 max-h-[300px]"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 max-h-[300px]"
            leave-to-class="opacity-0 max-h-0"
          >
            <nav v-show="sections.account" class="space-y-0.5 overflow-hidden">
              <NuxtLink :to="localePath('/profile')" class="sidebar-link" active-class="sidebar-link-active">
                <UserCircle class="w-5 h-5" />
                <span class="text-sm">Profilo</span>
              </NuxtLink>
              <NuxtLink v-if="isAdminOrOwner" :to="localePath('/team')" class="sidebar-link" active-class="sidebar-link-active">
                <UsersRound class="w-5 h-5" />
                <span class="text-sm">Team</span>
              </NuxtLink>
              <NuxtLink v-if="isAdminOrOwner" :to="localePath('/billing')" class="sidebar-link" active-class="sidebar-link-active">
                <CreditCard class="w-5 h-5" />
                <span class="text-sm">Billing</span>
              </NuxtLink>
              <NuxtLink :to="localePath('/settings')" class="sidebar-link" active-class="sidebar-link-active">
                <Settings class="w-5 h-5" />
                <span class="text-sm">Settings</span>
              </NuxtLink>
            </nav>
          </Transition>
        </div>
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-black/5 dark:border-white/5 space-y-2">
        <div class="flex items-center justify-between px-2">
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
        <button @click="authStore.logout" class="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-gray-600 dark:text-gray-400 hover:text-red-500 transition-colors">
          <LogOut class="w-4 h-4" />
          <span class="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { LayoutDashboard, Users, Megaphone, Settings, Sun, Moon, LogOut, MessageSquareText, MessageCircle, X, Smartphone, KanbanSquare, ChevronDown, UserCircle, UsersRound, CreditCard } from 'lucide-vue-next'
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

const sections = ref({
  platform: true,
  account: true
})

const hasWaFeature = computed(() => {
  return authStore.currentTeam?.activeFeatures?.includes('waforge.campaigns')
})

const currentRole = computed(() => {
  return authStore.user?.memberships?.[0]?.role || null
})

const isAdminOrOwner = computed(() => {
  const role = currentRole.value
  return role === 'OWNER' || role === 'ADMIN'
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
.sidebar-link {
  @apply flex items-center gap-3 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-gray-600 dark:text-gray-400;
}
.sidebar-link-active {
  @apply bg-primary/10 text-primary font-medium;
}
</style>
