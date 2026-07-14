<template>
  <div class="flex gap-4 group" :class="[role === 'user' ? 'justify-end' : 'justify-start']">
    <!-- Avatar (only for assistant) -->
    <div v-if="role === 'assistant'" class="w-8 h-8 rounded-full shrink-0 flex items-center justify-center bg-primary text-white shadow-lg">
      <Sparkles class="w-4 h-4" />
    </div>

    <div class="relative max-w-[85%] lg:max-w-[75%]">
      <div 
        class="px-5 py-4 rounded-2xl shadow-sm text-[15px] leading-relaxed relative animate-fade-in"
        :class="[
          role === 'user' 
            ? 'bg-black/5 dark:bg-white/5 rounded-br-sm border border-black/5 dark:border-white/5' 
            : 'bg-white dark:bg-[#1a1a1a] rounded-bl-sm border border-black/5 dark:border-white/5'
        ]"
      >
        <!-- Markdown Content -->
        <div v-if="role === 'assistant'" class="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-[#1e1e1e] prose-pre:text-[#d4d4d4] prose-pre:border prose-pre:border-white/10 prose-pre:shadow-xl prose-a:text-primary hover:prose-a:text-primary/80" v-html="sanitizedHtml"></div>
        
        <!-- Plain text for User -->
        <div v-else class="whitespace-pre-wrap">{{ content }}</div>
      </div>

      <!-- Actions -->
      <div v-if="role === 'assistant'" class="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <slot name="actions"></slot>
        <button @click="copyContent" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center gap-1.5 text-xs font-medium">
          <Copy v-if="!copied" class="w-3.5 h-3.5" />
          <Check v-else class="w-3.5 h-3.5 text-primary" />
          <span>{{ copied ? 'Copiato' : 'Copia test' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { Sparkles, Copy, Check } from 'lucide-vue-next'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

const props = defineProps<{
  role: 'user' | 'assistant' | 'system'
  content: string
}>()

const copied = ref(false)

// Configure Marked to use Highlight.js
marked.setOptions({
  highlight: function (code, lang) {
    const language = hljs.getLanguage(lang) ? lang : 'plaintext'
    return hljs.highlight(code, { language }).value
  },
  langPrefix: 'hljs language-',
  breaks: true,
  gfm: true
})

const sanitizedHtml = computed(() => {
  if (props.role !== 'assistant' || !props.content) return ''
  const rawHtml = marked.parse(props.content)
  return DOMPurify.sanitize(rawHtml as string)
})

const copyContent = async () => {
  try {
    await navigator.clipboard.writeText(props.content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy', err)
  }
}
</script>
