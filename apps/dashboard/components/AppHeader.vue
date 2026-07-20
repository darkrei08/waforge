<template>
  <header class="h-14 shrink-0 flex items-center justify-between gap-3 px-4 border-b border-white/5 bg-surface-bright/40 backdrop-blur-2xl z-10 sticky top-0">
    <div class="flex items-center gap-3">
      <button @click="$emit('toggleSidebar')" class="p-2 -ml-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group" title="Toggle Sidebar">
        <PanelLeft class="w-5 h-5 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
      </button>
      
      <!-- Breadcrumbs -->
      <nav class="flex items-center gap-1.5 text-sm overflow-hidden">
        <NuxtLink :to="localePath('/')" class="text-on-surface-variant hover:text-on-surface transition-colors shrink-0">
          <Home class="w-4 h-4" />
        </NuxtLink>
        <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
          <ChevronRight class="w-3 h-3 text-on-surface-variant/50 shrink-0" />
          <NuxtLink v-if="crumb.to" :to="crumb.to" class="text-on-surface-variant hover:text-on-surface transition-colors truncate max-w-[140px] capitalize">
            {{ crumb.label }}
          </NuxtLink>
          <span v-else class="font-semibold text-on-surface truncate max-w-[160px] capitalize">
            {{ crumb.label }}
          </span>
        </template>
      </nav>
    </div>

    <!-- Right side: Team + User -->
    <div class="flex items-center gap-3">
      <span v-if="authStore.currentTeam" class="hidden sm:inline text-xs text-on-surface-variant bg-white/5 px-3 py-1 rounded-full border border-white/5 truncate max-w-[150px]">
        {{ authStore.currentTeam.name }}
      </span>
      
      <!-- User dropdown -->
      <div class="relative" ref="dropdownRef">
        <button @click="showDropdown = !showDropdown" class="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-colors">
          <div class="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
            {{ userInitials }}
          </div>
          <ChevronDown class="w-3.5 h-3.5 text-on-surface-variant hidden sm:block" />
        </button>
        
        <Transition
          enter-active-class="transition-all duration-150 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-1"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-100 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div v-if="showDropdown" class="absolute right-0 top-12 w-56 bg-surface-container border border-white/10 rounded-2xl shadow-2xl p-2 z-50">
            <div class="px-3 py-2 border-b border-white/5 mb-1">
              <p class="text-sm font-semibold text-on-surface truncate">{{ authStore.user?.name || authStore.user?.email }}</p>
              <p class="text-xs text-on-surface-variant truncate">{{ authStore.user?.email }}</p>
            </div>
            <NuxtLink :to="localePath('/profile')" @click="showDropdown = false" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-colors">
              <User class="w-4 h-4" /> Profilo
            </NuxtLink>
            <NuxtLink :to="localePath('/billing')" @click="showDropdown = false" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-colors">
              <CreditCard class="w-4 h-4" /> Billing
            </NuxtLink>
            <NuxtLink :to="localePath('/settings')" @click="showDropdown = false" class="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-on-surface-variant hover:bg-white/5 hover:text-on-surface transition-colors">
              <Settings class="w-4 h-4" /> Settings
            </NuxtLink>
            <div class="border-t border-white/5 mt-1 pt-1">
              <button @click="authStore.logout(); showDropdown = false" class="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                <LogOut class="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PanelLeft, Home, ChevronRight, ChevronDown, User, CreditCard, Settings, LogOut } from 'lucide-vue-next'
import { useRoute } from '#imports'
import { useLocalePath } from '#i18n'
import { useAuthStore } from '~/stores/auth'

defineEmits(['toggleSidebar'])

const route = useRoute()
const localePath = useLocalePath()
const authStore = useAuthStore()

const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const routeNameMap: Record<string, string> = {
  'index': 'Dashboard',
  'devices': 'Dispositivi',
  'contacts': 'Contatti',
  'crm': 'CRM Pipeline',
  'campaigns': 'Campagne',
  'templates': 'Template',
  'chat': 'Workspace AI',
  'profile': 'Profilo',
  'billing': 'Billing',
  'team': 'Team',
  'settings': 'Settings',
  'connect': 'Connetti Dispositivo',
  'login': 'Login',
  'register': 'Registrazione',
  'api-status': 'API Status',
  'legal': 'Legal'
}

const breadcrumbs = computed(() => {
  const path = route.path.replace(/^\//, '').replace(/\/$/, '')
  if (!path || path === '') return [{ label: 'Dashboard', to: null }]
  
  const segments = path.split('/')
  return segments.map((seg, idx) => {
    const isLast = idx === segments.length - 1
    const fullPath = '/' + segments.slice(0, idx + 1).join('/')
    return {
      label: routeNameMap[seg] || seg.replace(/-/g, ' '),
      to: isLast ? null : localePath(fullPath)
    }
  })
})

const userInitials = computed(() => {
  const name = authStore.user?.name || authStore.user?.email || '?'
  return name.substring(0, 2).toUpperCase()
})

// Close dropdown on outside click
const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>
