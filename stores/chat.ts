import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

export interface ChatMessage {
  id: string
  teamId: string
  contactId: string
  direction: 'INBOUND' | 'OUTBOUND'
  type?: string
  content: string
  wamid?: string
  status: string
  metadata?: any
  createdAt: string
  sender?: { name: string } | null
}

export interface ChatConversation {
  id: string
  name: string
  fullPhone: string
  latestMessage?: ChatMessage | null
}

export const useChatStore = defineStore('chat', () => {
  const conversations = ref<ChatConversation[]>([])
  const messages = ref<Record<string, ChatMessage[]>>({}) // contactId -> messages
  const activeContactId = ref<string | null>(null)
  const loading = ref(false)
  const ws = ref<WebSocket | null>(null)
  
  const authStore = useAuthStore()

  async function fetchConversations() {
    loading.value = true
    try {
      const res = await $fetch<{ data: ChatConversation[] }>('/api/chat')
      conversations.value = res.data
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function fetchMessages(contactId: string) {
    loading.value = true
    try {
      const res = await $fetch<{ data: ChatMessage[] }>(`/api/chat/${contactId}/messages`)
      messages.value[contactId] = res.data
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
    }
  }

  async function sendMessage(contactId: string, text: string) {
    try {
      const res = await $fetch<{ data: ChatMessage }>('/api/chat/send', {
        method: 'POST',
        body: { contactId, text }
      })
      // Usually the broadcast covers us, but let's push locally just in case
      // We check if it's already there to prevent duplicates when WS echoes it
      if (!messages.value[contactId]) messages.value[contactId] = []
      const exists = messages.value[contactId].find(m => m.id === res.data.id)
      if (!exists) {
        messages.value[contactId].push(res.data)
      }
      return res.data
    } catch (e) {
      console.error('Error sending message', e)
      throw e
    }
  }

  function connectWebSocket() {
    if (ws.value) return // already connected

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/api/ws`
    
    const socket = new WebSocket(wsUrl)
    
    socket.onopen = () => {
      console.log('[WS] Connected to Chat CRM')
    }

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'new_message' && payload.data) {
          const msg = payload.data as ChatMessage
          const cid = msg.contactId
          
          if (!messages.value[cid]) messages.value[cid] = []
          const exists = messages.value[cid].find(m => m.id === msg.id)
          
          if (!exists) {
            messages.value[cid].push(msg)
          }

          // Update conversation list latest message
          const conv = conversations.value.find(c => c.id === cid)
          if (conv) {
            conv.latestMessage = msg
            // move to top
            conversations.value = [
              conv,
              ...conversations.value.filter(c => c.id !== cid)
            ]
          } else {
            // Need to fetch new conversation if it doesn't exist
            fetchConversations()
          }
        }
        
        if (payload.type === 'message_ack' && payload.data) {
          const ackMsg = payload.data as ChatMessage
          const cid = ackMsg.contactId
          if (messages.value[cid]) {
            const existingMsgIndex = messages.value[cid].findIndex(m => m.id === ackMsg.id || m.wamid === ackMsg.wamid)
            if (existingMsgIndex !== -1) {
              // Update status
              messages.value[cid][existingMsgIndex].status = ackMsg.status
            }
          }
        }
      } catch (err) {
        console.error('WS parse error', err)
      }
    }

    socket.onclose = () => {
      console.log('[WS] Disconnected, reconnecting in 3s...')
      ws.value = null
      setTimeout(connectWebSocket, 3000)
    }

    ws.value = socket
  }

  function disconnectWebSocket() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  return {
    conversations,
    messages,
    activeContactId,
    loading,
    fetchConversations,
    fetchMessages,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket
  }
})
