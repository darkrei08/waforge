<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="$emit('close')">
      <div class="w-full max-w-2xl bg-surface-container-high border border-white/10 rounded-2xl flex flex-col max-h-[85vh] shadow-2xl animate-slide-in">
        
        <div class="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <div>
            <h3 class="text-xl font-bold text-on-surface">Gestione Rubriche</h3>
            <p v-if="selectedCount > 0" class="text-sm text-primary mt-1">
              Stai gestendo le rubriche per {{ selectedCount }} contatti selezionati.
            </p>
          </div>
          <button @click="$emit('close')" class="p-2 rounded-lg hover:bg-white/5 text-on-surface-variant transition-colors">
            <X class="w-5 h-5" />
          </button>
        </div>

        <div class="p-6 overflow-y-auto flex-1 space-y-6">
          <!-- Create Group -->
          <form @submit.prevent="handleCreateGroup" class="flex gap-3">
            <input v-model="newGroupName" type="text" placeholder="Nuova rubrica (es. VIP, Lead...)" required
                   class="flex-1 px-4 py-2 bg-surface-container border border-white/10 rounded-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary/50 outline-none transition-all" />
            <button type="submit" :disabled="groupsStore.loading || !newGroupName.trim()"
                    class="px-4 py-2 bg-primary/20 text-primary font-semibold rounded-lg hover:bg-primary/30 transition-all disabled:opacity-50 flex items-center gap-2">
              <Plus class="w-4 h-4" /> Crea
            </button>
          </form>

          <div v-if="groupsStore.loading && groupsStore.groups.length === 0" class="flex justify-center p-8">
            <Loader2 class="w-8 h-8 animate-spin text-primary/50" />
          </div>

          <div v-else class="space-y-2">
            <div v-if="groupsStore.groups.length === 0" class="text-center p-8 text-on-surface-variant border border-dashed border-white/10 rounded-xl">
              Nessuna rubrica creata.
            </div>
            
            <div v-for="group in groupsStore.groups" :key="group.id" 
                 class="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {{ group.name.substring(0, 1).toUpperCase() }}
                </div>
                <div>
                  <h4 class="font-semibold text-on-surface">{{ group.name }}</h4>
                  <p class="text-xs text-on-surface-variant">{{ group._count?.contacts || 0 }} contatti</p>
                </div>
              </div>
              
              <div class="flex items-center gap-2">
                <template v-if="selectedCount > 0">
                  <button @click="handleAssignGroup(group.id, 'add')" class="px-3 py-1.5 text-xs font-semibold bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-all">
                    Assegna Selezionati
                  </button>
                  <button @click="handleAssignGroup(group.id, 'remove')" class="px-3 py-1.5 text-xs font-semibold bg-error/20 text-error rounded-lg hover:bg-error/30 transition-all" title="Rimuovi selezionati da questa rubrica">
                    <Minus class="w-4 h-4" />
                  </button>
                </template>
                
                <button @click="handleDeleteGroup(group.id, group.name)" class="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-all" title="Elimina rubrica">
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { X, Plus, Trash2, Loader2, Minus } from 'lucide-vue-next'
import { useContactGroupsStore } from '~/stores/contactGroups'
import { useContactsStore } from '~/stores/contacts'

const props = defineProps<{
  isOpen: boolean
  selectedCount: number
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const addToast = inject('addToast') as Function
const groupsStore = useContactGroupsStore()
const contactsStore = useContactsStore()

const newGroupName = ref('')

onMounted(() => {
  groupsStore.fetchGroups()
})

async function handleCreateGroup() {
  if (!newGroupName.value.trim()) return
  try {
    await groupsStore.createGroup({ name: newGroupName.value.trim() })
    newGroupName.value = ''
    addToast('Rubrica creata', 'success')
  } catch (err: any) {
    addToast(err.data?.message || err.message || 'Errore', 'error')
  }
}

async function handleDeleteGroup(id: string, name: string) {
  if (!confirm(`Sei sicuro di voler eliminare la rubrica "${name}"? I contatti all'interno NON verranno eliminati.`)) return
  try {
    await groupsStore.deleteGroup(id)
    addToast('Rubrica eliminata', 'success')
  } catch (err: any) {
    addToast(err.data?.message || err.message || 'Errore', 'error')
  }
}

async function handleAssignGroup(groupId: string, action: 'add' | 'remove') {
  if (props.selectedCount === 0) return
  try {
    await contactsStore.bulkUpdateGroups(Array.from(contactsStore.selected), groupId, action)
    addToast(`Contatti ${action === 'add' ? 'assegnati alla' : 'rimossi dalla'} rubrica`, 'success')
    groupsStore.fetchGroups() // Refresh counts
  } catch (err: any) {
    addToast(err.data?.message || err.message || 'Errore', 'error')
  }
}
</script>
