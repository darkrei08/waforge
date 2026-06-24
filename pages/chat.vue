<template>
  <div class="h-full flex flex-col sm:flex-row overflow-hidden animate-fade-in p-4 sm:p-8 gap-6">
    
    <!-- Left Sidebar: Conversations List -->
    <div class="w-full sm:w-[350px] flex-shrink-0 flex flex-col bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      <div class="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 class="text-xl font-bold text-on-surface tracking-tight">{{ t('nav.chat') }}</h2>
        <span class="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">Live CRM</span>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <div v-if="store.loading && store.conversations.length === 0" class="p-4 text-center text-sm text-on-surface-variant">
          Caricamento conversazioni...
        </div>
        <div v-else-if="store.conversations.length === 0" class="p-4 text-center text-sm text-on-surface-variant">
          Nessuna conversazione attiva.
        </div>
        
        <button v-for="conv in store.conversations" :key="conv.id" 
                @click="selectContact(conv.id)"
                class="w-full text-left p-3 rounded-xl transition-all flex items-center gap-3 border"
                :class="store.activeContactId === conv.id 
                  ? 'bg-primary/10 border-primary text-on-surface' 
                  : 'bg-transparent border-transparent hover:bg-white/5 text-on-surface-variant hover:text-on-surface'">
          <div class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold text-lg flex-shrink-0">
            {{ conv.name.charAt(0).toUpperCase() }}
          </div>
          <div class="flex-1 overflow-hidden">
            <div class="flex justify-between items-baseline mb-1">
              <span class="font-semibold truncate pr-2">{{ conv.name }}</span>
              <span v-if="conv.latestMessage" class="text-[10px] opacity-60 flex-shrink-0">
                {{ formatTime(conv.latestMessage.createdAt) }}
              </span>
            </div>
            <p class="text-xs opacity-70 truncate">
              <span v-if="conv.latestMessage?.direction === 'OUTBOUND'">Tu: </span>
              {{ conv.latestMessage?.content || 'Nessun messaggio' }}
            </p>
          </div>
        </button>
      </div>
    </div>

    <!-- Right Pane: Active Chat -->
    <div class="flex-1 flex flex-col bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden relative">
      <template v-if="store.activeContactId && activeConversation">
        
        <!-- Chat Header -->
        <div class="p-4 border-b border-white/10 bg-surface-container/80 flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary font-bold">
            {{ activeConversation.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h3 class="font-semibold text-on-surface">{{ activeConversation.name }}</h3>
            <p class="text-xs text-on-surface-variant">{{ activeConversation.fullPhone }}</p>
          </div>
        </div>

        <!-- Messages Area -->
        <div class="flex-1 overflow-y-auto p-6 space-y-4" ref="messagesContainer">
          <div v-for="msg in activeMessages" :key="msg.id" 
               class="flex flex-col max-w-[75%]"
               :class="msg.direction === 'OUTBOUND' ? 'self-end items-end ml-auto' : 'self-start items-start'">
            
            <span v-if="msg.direction === 'OUTBOUND' && msg.sender" class="text-[10px] text-on-surface-variant mb-1 px-1">
              {{ msg.sender.name }}
            </span>

            <div class="p-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm"
                 :class="msg.direction === 'OUTBOUND' 
                   ? 'bg-primary text-on-primary rounded-tr-sm' 
                   : 'bg-surface-container-high text-on-surface rounded-tl-sm'">
              {{ msg.content }}
            </div>
            
            <div class="flex items-center gap-1 mt-1 px-1 text-[10px] text-on-surface-variant">
              <span>{{ formatTime(msg.createdAt) }}</span>
              <span v-if="msg.direction === 'OUTBOUND'">
                <Check v-if="msg.status === 'SENT'" class="w-3 h-3 text-on-surface-variant" />
                <CheckCheck v-if="msg.status === 'DELIVERED'" class="w-3 h-3 text-secondary" />
              </span>
            </div>
          </div>
        </div>

        <!-- Message Input Area -->
        <div class="p-4 bg-surface-container/80 border-t border-white/10">
          <form @submit.prevent="handleSend" class="flex items-end gap-3">
            <div class="flex-1 bg-black/30 border border-white/10 rounded-xl overflow-hidden focus-within:border-primary transition-colors">
              <textarea v-model="inputText" rows="1" 
                        @keydown.enter.exact.prevent="handleSend"
                        placeholder="Scrivi un messaggio... (Invio per spedire)"
                        class="w-full max-h-32 p-3 bg-transparent text-sm text-on-surface outline-none resize-none overflow-y-auto block"
                        ref="inputArea"></textarea>
            </div>
            <button type="submit" :disabled="!inputText.trim() || sending"
                    class="p-3 bg-primary text-on-primary rounded-xl hover:shadow-[0_0_15px_rgba(37,211,102,0.4)] transition-all disabled:opacity-30 flex-shrink-0 flex items-center justify-center">
              <SendIcon class="w-5 h-5" />
            </button>
          </form>
        </div>
      </template>

      <!-- Empty State -->
      <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div class="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <MessageCircle class="w-12 h-12 text-primary/40" />
        </div>
        <h3 class="text-xl font-bold text-on-surface mb-2">Web WhatsApp CRM</h3>
        <p class="text-sm text-on-surface-variant max-w-sm">
          Seleziona una conversazione dalla barra laterale per iniziare a chattare in tempo reale con i tuoi contatti.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { Send as SendIcon, Check, CheckCheck, MessageCircle } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useChatStore } from '~/stores/chat'

const { t } = useI18n()
const store = useChatStore()

const inputText = ref('')
const sending = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const inputArea = ref<HTMLTextAreaElement | null>(null)

const activeConversation = computed(() => {
  return store.conversations.find(c => c.id === store.activeContactId)
})

const activeMessages = computed(() => {
  if (!store.activeContactId) return []
  return store.messages[store.activeContactId] || []
})

function formatTime(isoString: string) {
  const d = new Date(isoString)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

async function selectContact(id: string) {
  store.activeContactId = id
  if (!store.messages[id]) {
    await store.fetchMessages(id)
  }
  scrollToBottom()
  setTimeout(() => inputArea.value?.focus(), 50)
}

async function handleSend() {
  if (!inputText.value.trim() || !store.activeContactId || sending.value) return
  
  const text = inputText.value.trim()
  inputText.value = '' // clear immediately for UX
  
  sending.value = true
  try {
    await store.sendMessage(store.activeContactId, text)
    scrollToBottom()
  } catch (e) {
    console.error(e)
    inputText.value = text // restore on failure
  } finally {
    sending.value = false
  }
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Watch for new messages to auto-scroll
watch(activeMessages, () => {
  scrollToBottom()
}, { deep: true })

onMounted(() => {
  store.fetchConversations()
  store.connectWebSocket()
})

onUnmounted(() => {
  store.disconnectWebSocket()
})
</script>
