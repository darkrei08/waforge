<template>
  <div>
    <!-- Modale Prefissi Internazionali -->
    <Teleport to="body">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="$emit('close')">
        <div class="w-full max-w-md bg-surface-container-high border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-in flex flex-col max-h-[80vh]">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-on-surface flex items-center gap-2">
              <Globe class="w-5 h-5 text-primary" /> Prefissi Internazionali
            </h3>
            <button @click="$emit('close')" class="text-on-surface-variant hover:text-on-surface">
              <X class="w-5 h-5" />
            </button>
          </div>
          
          <div class="relative mb-4 shrink-0">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
            <input v-model="searchQuery" type="text" placeholder="Cerca nazione o prefisso..."
                   class="w-full pl-10 pr-4 py-2 bg-surface-container border border-white/10 rounded-lg text-on-surface text-sm placeholder-on-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all" />
          </div>

          <div class="flex-1 overflow-y-auto space-y-1 pr-2 custom-scrollbar">
            <div v-for="country in filteredPrefixes" :key="country.code" 
                 class="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg transition-colors cursor-pointer group"
                 @click="copyToClipboard(country.dial_code)">
              <div class="flex items-center gap-3">
                <span class="text-xl">{{ country.emoji }}</span>
                <span class="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">{{ country.name }}</span>
              </div>
              <span class="font-mono text-sm text-on-surface-variant bg-white/5 px-2 py-1 rounded">{{ country.dial_code }}</span>
            </div>
            
            <div v-if="filteredPrefixes.length === 0" class="text-center p-4 text-sm text-on-surface-variant">
              Nessun prefisso trovato.
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { Globe, X, Search, Copy } from 'lucide-vue-next'

const props = defineProps<{ isOpen: boolean }>()
defineEmits(['close'])

const addToast = inject('addToast') as Function
const searchQuery = ref('')

const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    addToast(`Prefisso ${text} copiato`, 'success')
  } catch (err) {
    console.error('Failed to copy', err)
  }
}

// Ridotta lista per praticità. Un vero sistema avrebbe tutti i country code.
const prefixes = [
  { name: 'Italia', dial_code: '+39', code: 'IT', emoji: '🇮🇹' },
  { name: 'Stati Uniti', dial_code: '+1', code: 'US', emoji: '🇺🇸' },
  { name: 'Regno Unito', dial_code: '+44', code: 'GB', emoji: '🇬🇧' },
  { name: 'Germania', dial_code: '+49', code: 'DE', emoji: '🇩🇪' },
  { name: 'Francia', dial_code: '+33', code: 'FR', emoji: '🇫🇷' },
  { name: 'Spagna', dial_code: '+34', code: 'ES', emoji: '🇪🇸' },
  { name: 'Svizzera', dial_code: '+41', code: 'CH', emoji: '🇨🇭' },
  { name: 'Brasile', dial_code: '+55', code: 'BR', emoji: '🇧🇷' },
  { name: 'India', dial_code: '+91', code: 'IN', emoji: '🇮🇳' },
  { name: 'Cina', dial_code: '+86', code: 'CN', emoji: '🇨🇳' },
  { name: 'Giappone', dial_code: '+81', code: 'JP', emoji: '🇯🇵' },
  { name: 'Australia', dial_code: '+61', code: 'AU', emoji: '🇦🇺' },
  { name: 'Canada', dial_code: '+1', code: 'CA', emoji: '🇨🇦' },
  { name: 'Russia', dial_code: '+7', code: 'RU', emoji: '🇷🇺' },
  { name: 'Messico', dial_code: '+52', code: 'MX', emoji: '🇲🇽' },
  { name: 'Argentina', dial_code: '+54', code: 'AR', emoji: '🇦🇷' },
  { name: 'Sudafrica', dial_code: '+27', code: 'ZA', emoji: '🇿🇦' },
  { name: 'Corea del Sud', dial_code: '+82', code: 'KR', emoji: '🇰🇷' },
  { name: 'Turchia', dial_code: '+90', code: 'TR', emoji: '🇹🇷' },
  { name: 'Emirati Arabi Uniti', dial_code: '+971', code: 'AE', emoji: '🇦🇪' },
]

const filteredPrefixes = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return prefixes
  return prefixes.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.dial_code.includes(q)
  )
})
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.02);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
