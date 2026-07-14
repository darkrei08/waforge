<template>
  <div class="relative w-full max-w-4xl mx-auto animate-fade-in">
    <div 
      class="flex items-end gap-2 p-2 rounded-[28px] bg-white dark:bg-[#1a1a19] shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-[0_0_20px_rgba(0,0,0,0.3)] border border-black/5 dark:border-white/10 transition-shadow focus-within:shadow-[0_0_20px_rgba(37,211,102,0.15)] focus-within:border-primary/30"
    >
      <!-- Prefix Slot -->
      <slot name="prefix"></slot>

      <!-- Attachment Button -->
      <slot name="attachment">
        <button type="button" @click="$emit('attach')" class="p-3 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 mb-0.5">
          <Paperclip class="w-5 h-5" />
        </button>
      </slot>

      <!-- Textarea -->
      <textarea
        ref="textareaRef"
        v-model="internalValue"
        :placeholder="placeholder || 'Chiedi a WaForge Co-Pilot...'"
        class="w-full max-h-[200px] min-h-[44px] py-3.5 bg-transparent text-gray-900 dark:text-[#faf9f5] placeholder:text-gray-400 focus:outline-none resize-none overflow-y-auto font-sans leading-relaxed"
        @input="autoResize"
        @keydown.enter.prevent="handleEnter"
        rows="1"
      ></textarea>

      <!-- Send Button -->
      <button 
        type="button" 
        @click="send"
        :disabled="!internalValue.trim() || disabled"
        class="p-3 rounded-full shrink-0 transition-all duration-300 mb-0.5 flex items-center justify-center"
        :class="internalValue.trim() && !disabled ? 'bg-primary text-white shadow-md hover:shadow-lg hover:scale-105' : 'bg-black/5 dark:bg-white/5 text-gray-400 cursor-not-allowed'"
      >
        <Send v-if="!loading" class="w-5 h-5 ml-0.5" />
        <Loader2 v-else class="w-5 h-5 animate-spin" />
      </button>
    </div>
    <div class="text-center mt-3">
      <p class="text-xs text-gray-400 dark:text-gray-500 font-sans">L'AI può commettere errori. Verifica sempre le informazioni generate.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Paperclip, Send, Loader2 } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  loading?: boolean
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'send'): void
  (e: 'attach'): void
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const internalValue = ref(props.modelValue)

watch(() => props.modelValue, (newVal) => {
  internalValue.value = newVal
  autoResize()
})

watch(internalValue, (newVal) => {
  emit('update:modelValue', newVal)
})

const autoResize = async () => {
  await nextTick()
  if (textareaRef.value) {
    textareaRef.value.style.height = 'auto'
    textareaRef.value.style.height = `${Math.min(textareaRef.value.scrollHeight, 200)}px`
  }
}

const handleEnter = (e: KeyboardEvent) => {
  if (e.shiftKey) {
    return // let new line happen naturally
  }
  send()
}

const send = () => {
  if (!internalValue.value.trim() || props.loading || props.disabled) return
  emit('send')
}
</script>
