<template>
  <div class="absolute inset-0 flex flex-col sm:flex-row overflow-hidden animate-fade-in p-4 sm:p-8 gap-6">
    
    <!-- Left Sidebar: Conversations List -->
    <div class="w-full sm:w-[350px] flex-shrink-0 flex flex-col bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
      <div class="p-4 border-b border-white/10 flex items-center justify-between">
        <h2 class="text-xl font-bold text-on-surface tracking-tight">{{ t('chat.title') }}</h2>
        <span class="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded">{{ t('chat.badge') }}</span>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2 space-y-1">
        <div v-if="store.loading && store.conversations.length === 0" class="p-4 text-center text-sm text-on-surface-variant">
          {{ t('chat.loading') }}
        </div>
        <div v-else-if="store.conversations.length === 0" class="p-4 text-center text-sm text-on-surface-variant">
          {{ t('chat.no_conversations') }}
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
              <span v-if="conv.latestMessage?.direction === 'OUTBOUND'">{{ t('chat.you_prefix') }}</span>
              {{ conv.latestMessage?.content || t('chat.no_messages') }}
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
              
              <!-- Anteprima Media -->
              <div v-if="msg.metadata?.mediaUrl" class="mb-2">
                <img v-if="msg.type === 'image'" :src="msg.metadata.mediaUrl" class="max-w-[240px] rounded-lg max-h-48 object-cover" />
                <audio v-else-if="msg.type === 'audio' || msg.type === 'ptt'" :src="msg.metadata.mediaUrl" controls class="max-w-[240px]" />
                <video v-else-if="msg.type === 'video'" :src="msg.metadata.mediaUrl" controls class="max-w-[240px] max-h-48 rounded-lg" />
                <a v-else :href="msg.metadata.mediaUrl" target="_blank" class="flex items-center gap-2 underline text-xs font-bold bg-black/10 p-2 rounded-lg break-all">
                  <Paperclip class="w-4 h-4 shrink-0" /> Apri Allegato
                </a>
              </div>
              
              <template v-if="msg.content && !(msg.type === 'audio' && !msg.content.trim())">{{ msg.content }}</template>
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
        <div class="p-4 bg-transparent flex flex-col gap-2 relative z-10 shrink-0">
          
          <!-- Interfaccia Registrazione Audio -->
          <div v-if="recording" class="flex items-center gap-4 bg-error/10 text-error p-3 rounded-xl border border-error/20">
            <div class="flex items-center gap-2 flex-1">
              <span class="w-2.5 h-2.5 rounded-full bg-error animate-pulse"></span>
              <span class="font-bold text-sm font-mono">{{ recordingTimeDisplay }}</span>
              <span class="text-xs opacity-80 ml-2">Registrazione in corso...</span>
            </div>
            <button @click="cancelRecording" class="p-2 hover:bg-error/20 rounded-full transition-colors" title="Annulla">
              <X class="w-4 h-4" />
            </button>
            <button @click="stopRecording" class="px-4 py-2 bg-error text-white rounded-lg font-bold text-sm shadow-md hover:bg-red-600 transition-colors flex items-center gap-2" title="Invia Audio">
              <SendIcon class="w-4 h-4" /> Invia
            </button>
          </div>

          <!-- ChatInputCapsule -->
          <ChatInputCapsule
            v-else
            v-model="inputText"
            :placeholder="uploading ? t('chat.uploading_media', 'Caricamento media in corso...') : t('chat.input_placeholder')"
            :disabled="uploading || sending"
            :loading="uploading || sending"
            @send="handleSend"
            @attach="triggerFileInput"
          >
            <!-- Prefix Slot: Microfono -->
            <template #prefix>
              <button type="button" @click="startRecording" :disabled="sending || uploading"
                      class="p-3 rounded-full text-gray-400 hover:text-error hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 mb-0.5"
                      title="Registra Messaggio Vocale">
                <Mic class="w-5 h-5" />
              </button>
            </template>
          </ChatInputCapsule>

          <!-- Input File Nascosto -->
          <input type="file" ref="fileInput" class="hidden" @change="onFileSelected" />
        </div>
      </template>

      <!-- Empty State -->
      <div v-else class="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div class="w-24 h-24 bg-primary/5 rounded-full flex items-center justify-center mb-6">
          <MessageCircle class="w-12 h-12 text-primary/40" />
        </div>
        <h3 class="text-xl font-bold text-on-surface mb-2">{{ t('chat.empty_title') }}</h3>
        <p class="text-sm text-on-surface-variant max-w-sm">
          {{ t('chat.empty_message') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch, inject } from 'vue'
import { Send as SendIcon, Check, CheckCheck, MessageCircle, Paperclip, Mic, Square, Loader2, X } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useChatStore } from '~/stores/chat'

const { t } = useI18n()
const store = useChatStore()
const addToast = inject('addToast') as (msg: string, type?: string) => void

const inputText = ref('')
const sending = ref(false)
const uploading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const inputArea = ref<HTMLTextAreaElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// Stato Registrazione Audio
const recording = ref(false)
const recordingTime = ref(0)
let mediaRecorder: MediaRecorder | null = null
let audioChunks: Blob[] = []
let recordTimer: any = null

const recordingTimeDisplay = computed(() => {
  const m = Math.floor(recordingTime.value / 60).toString().padStart(2, '0')
  const s = (recordingTime.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

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
  if (!inputText.value.trim() || !store.activeContactId || sending.value || uploading.value) return
  
  const text = inputText.value.trim()
  inputText.value = '' // clear immediately for UX
  
  sending.value = true
  try {
    await store.sendMessage(store.activeContactId, text)
    scrollToBottom()
  } catch (e) {
    console.error(e)
    inputText.value = text // restore on failure
    if (addToast) addToast('Errore invio messaggio', 'error')
  } finally {
    sending.value = false
  }
}

// ==========================
// MEDIA & AUDIO UPLOAD LOGIC
// ==========================
function triggerFileInput() {
  fileInput.value?.click()
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  
  const file = target.files[0]
  target.value = '' // reset input
  await uploadAndSendMedia(file)
}

async function uploadAndSendMedia(file: File | Blob, ext: string = '') {
  if (!store.activeContactId) return
  
  uploading.value = true
  try {
    const formData = new FormData()
    const filename = file instanceof File ? file.name : `audio.${ext || 'webm'}`
    formData.append('file', file, filename)
    
    const uploadRes = await $fetch<any>('/api/upload', {
      method: 'POST',
      body: formData
    })
    
    if (uploadRes && uploadRes.data && uploadRes.data.url) {
      await store.sendMessage(store.activeContactId, '', uploadRes.data.url)
      scrollToBottom()
    } else {
      throw new Error('Upload fallito: URL non restituito')
    }
  } catch (err: any) {
    console.error('Errore invio media', err)
    if (addToast) addToast(`Errore invio media: ${err.message || 'Rete'}`, 'error')
  } finally {
    uploading.value = false
  }
}

async function startRecording() {
  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (addToast) addToast('Il browser blocca il microfono in HTTP. Usa localhost o abilita HTTPS.', 'error')
      return
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream)
    audioChunks = []
    
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunks.push(e.data)
    }
    
    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' })
      stream.getTracks().forEach(track => track.stop()) // Libera il microfono
      
      if (recording.value) { // Se non è stato annullato
        await uploadAndSendMedia(audioBlob, 'webm')
      }
      recording.value = false
    }
    
    recordingTime.value = 0
    recording.value = true
    mediaRecorder.start(200) // Buffer da 200ms
    
    recordTimer = setInterval(() => {
      recordingTime.value++
    }, 1000)
    
  } catch (err: any) {
    console.error('Mic error:', err)
    if (addToast) addToast('Impossibile accedere al microfono. Controlla i permessi.', 'error')
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    clearInterval(recordTimer)
    mediaRecorder.stop()
  }
}

function cancelRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    recording.value = false // imposta false PRIMA del stop() per annullare l'invio
    clearInterval(recordTimer)
    mediaRecorder.stop()
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
