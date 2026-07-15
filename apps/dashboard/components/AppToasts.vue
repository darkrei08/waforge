<template>
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
          <button @click="$emit('remove', toast.id)" class="ml-auto p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors shrink-0">
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </TransitionGroup>
    </Teleport>
  </ClientOnly>
</template>

<script setup lang="ts">
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-vue-next'

defineProps<{
  toasts: { id: number, message: string, type: 'success'|'error'|'info' }[]
}>()
defineEmits(['remove'])
</script>

<style scoped>
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
</style>
