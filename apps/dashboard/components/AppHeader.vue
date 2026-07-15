<template>
  <header class="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-white/5 bg-surface-bright/40 backdrop-blur-2xl z-10 sticky top-0">
    <button @click="$emit('toggleSidebar')" class="p-2 -ml-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group" title="Toggle Sidebar">
      <PanelLeft class="w-5 h-5 text-gray-500 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
    </button>
    <div class="flex items-center gap-2">
      <h2 class="font-heading font-semibold text-sm capitalize text-on-surface">{{ routeName }}</h2>
    </div>
  </header>
</template>

<script setup lang="ts">
import { PanelLeft } from 'lucide-vue-next'
import { computed } from 'vue'
import { useRoute } from '#imports'

defineEmits(['toggleSidebar'])

const route = useRoute()
const routeName = computed(() => {
  if (!route.name) return 'Dashboard'
  return route.name.toString().replace(/-/g, ' ')
})
</script>
