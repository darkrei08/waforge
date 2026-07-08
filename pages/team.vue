<template>
  <div class="p-8 h-full flex flex-col">
    <div class="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
      <div>
        <h2 class="text-3xl font-bold text-on-surface">{{ t('nav.team') }}</h2>
        <p class="text-on-surface-variant mt-1">Gestisci i dettagli del team e i suoi membri.</p>
      </div>
      <button @click="showInviteModal = true" class="px-5 py-2.5 bg-primary hover:bg-primary-fixed-dim text-surface font-semibold rounded-lg transition-colors flex items-center gap-2 shrink-0">
        <UserPlus class="w-5 h-5" />
        Invita Utente
      </button>
    </div>

    <!-- Team Details Form -->
    <div class="bg-surface-container/50 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-2xl p-6 shadow-xl mb-8">
      <h3 class="text-lg font-bold text-on-surface mb-4">Informazioni Team</h3>
      <form @submit.prevent="updateTeam" class="flex flex-col gap-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">Nome del Team</label>
            <input v-model="teamForm.name" type="text" required class="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-on-surface">
          </div>
          <div>
            <label class="block text-sm font-medium text-on-surface-variant mb-1">Tags (separati da virgola)</label>
            <input v-model="teamForm.tags" type="text" placeholder="es. marketing, vendite" class="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-on-surface">
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-on-surface-variant mb-1">Descrizione</label>
            <textarea v-model="teamForm.description" rows="2" placeholder="Descrizione del team..." class="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-on-surface resize-none"></textarea>
          </div>
        </div>
        <div class="flex justify-end mt-2">
          <button type="submit" :disabled="updatingTeam" class="px-5 py-2.5 bg-surface-variant hover:bg-white/5 text-on-surface font-semibold rounded-lg transition-colors disabled:opacity-50 min-w-[120px]">
            {{ updatingTeam ? 'Salvataggio...' : 'Salva' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Members Table -->
    <div class="bg-surface-container/50 backdrop-blur-md border border-black/5 dark:border-white/5 rounded-2xl overflow-hidden shadow-xl flex-1">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-black/5 dark:bg-white/5 text-on-surface-variant border-b border-black/5 dark:border-white/10 text-sm">
            <tr>
              <th class="py-4 px-6 font-semibold rounded-tl-2xl">Nome</th>
              <th class="py-4 px-6 font-semibold">Email</th>
              <th class="py-4 px-6 font-semibold">Ruolo</th>
              <th class="py-4 px-6 font-semibold">Iscritto il</th>
              <th class="py-4 px-6 font-semibold text-right rounded-tr-2xl">Azioni</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/5 dark:divide-white/10">
            <tr v-if="loading" class="animate-pulse">
              <td colspan="5" class="py-8 text-center text-on-surface-variant">Caricamento membri...</td>
            </tr>
            <tr v-else-if="members.length === 0">
              <td colspan="5" class="py-8 text-center text-on-surface-variant">Nessun membro trovato.</td>
            </tr>
            <tr v-for="member in members" :key="member.id" class="hover:bg-white/5 transition-colors group">
              <td class="py-4 px-6 font-medium">{{ member.user.name }}</td>
              <td class="py-4 px-6 text-on-surface-variant">{{ member.user.email }}</td>
              <td class="py-4 px-6">
                <span class="px-2.5 py-1 text-xs font-semibold rounded-full"
                      :class="member.role === 'OWNER' ? 'bg-primary/20 text-primary' : member.role === 'ADMIN' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'">
                  {{ member.role }}
                </span>
              </td>
              <td class="py-4 px-6 text-on-surface-variant">{{ new Date(member.user.createdAt).toLocaleDateString() }}</td>
              <td class="py-4 px-6 text-right">
                <button v-if="member.userId !== authStore.user?.userId" @click="removeMember(member.id)" class="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Rimuovi dal team">
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Invite Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showInviteModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" @click.self="showInviteModal = false">
          <div class="bg-surface-container w-full max-w-md rounded-2xl shadow-2xl border border-white/10 overflow-hidden transform transition-all" @click.stop>
            <div class="p-6 border-b border-white/10 flex items-center justify-between">
              <h3 class="text-xl font-bold">Invita Utente</h3>
              <button @click="showInviteModal = false" class="p-1 hover:bg-white/10 rounded-lg transition-colors"><X class="w-5 h-5"/></button>
            </div>
            
            <form @submit.prevent="inviteUser" class="p-6 space-y-4">
              <p class="text-sm text-on-surface-variant mb-4">Verrà inviata un'email all'indirizzo inserito con un link (valido 48h) per completare la registrazione e unirsi al team.</p>
              
              <div>
                <label class="block text-sm font-medium text-on-surface-variant mb-1">Email</label>
                <input v-model="inviteForm.email" required type="email" class="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-on-surface">
              </div>

              <div>
                <label class="block text-sm font-medium text-on-surface-variant mb-1">Ruolo</label>
                <select v-model="inviteForm.role" class="w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary transition-colors text-on-surface">
                  <option value="AGENT">Agent</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div v-if="inviteSuccess" class="p-3 bg-primary/10 text-primary text-sm rounded-lg border border-primary/20 break-all">
                {{ inviteSuccess }}
              </div>
              <div v-if="inviteError" class="p-3 bg-error/10 text-error text-sm rounded-lg border border-error/20">
                {{ inviteError }}
              </div>

              <div class="pt-4 flex gap-3 justify-end">
                <button type="button" @click="showInviteModal = false" class="px-5 py-2.5 text-on-surface-variant hover:bg-white/5 rounded-lg transition-colors font-medium">Annulla</button>
                <button type="submit" :disabled="inviting" class="px-5 py-2.5 bg-primary hover:bg-primary-fixed-dim text-surface rounded-lg transition-colors font-semibold flex items-center gap-2 disabled:opacity-50">
                  <Loader2 v-if="inviting" class="w-4 h-4 animate-spin" />
                  Invia Invito
                </button>
              </div>
            </form>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, inject } from 'vue'
import { UserPlus, Trash2, X, Loader2 } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useAuthStore } from '~/stores/auth'

const { t } = useI18n()
const authStore = useAuthStore()
const addToast = inject('addToast') as Function

const teamForm = ref({ name: '', description: '', tags: '' })
const updatingTeam = ref(false)

const members = ref<any[]>([])
const loading = ref(true)

const showInviteModal = ref(false)
const inviting = ref(false)
const inviteError = ref('')
const inviteSuccess = ref('')
const inviteForm = ref({ email: '', role: 'AGENT' })

const fetchTeam = async () => {
  try {
    const res = await $fetch<{ team: any }>('/api/team')
    teamForm.value.name = res.team?.name || ''
    teamForm.value.description = res.team?.description || ''
    teamForm.value.tags = res.team?.tags || ''
  } catch (e: any) {
    console.error('Error fetching team', e)
  }
}

const updateTeam = async () => {
  updatingTeam.value = true
  try {
    const res = await $fetch('/api/team', {
      method: 'PATCH',
      body: teamForm.value
    })
    addToast('Team aggiornato', 'success')
  } catch (e: any) {
    addToast(e.data?.message || 'Errore durante l\'aggiornamento del team', 'error')
  } finally {
    updatingTeam.value = false
  }
}

const fetchMembers = async () => {
  loading.value = true
  try {
    const res = await $fetch<{ members: any[] }>('/api/team/members')
    members.value = res.members || []
  } catch (e: any) {
    addToast(e.statusMessage || 'Error fetching members', 'error')
  } finally {
    loading.value = false
  }
}

const inviteUser = async () => {
  inviteError.value = ''
  inviteSuccess.value = ''
  inviting.value = true
  try {
    const res: any = await $fetch('/api/auth/invite', {
      method: 'POST',
      body: inviteForm.value
    })
    
    // Mostriamo il token se generato localmente (es. no SMTP)
    if (res.inviteToken) {
      inviteSuccess.value = 'Link invito (SMTP disabilitato): /register?invite=' + res.inviteToken
      addToast('Token d\'invito generato', 'info')
    } else {
      addToast('Invito inviato con successo!', 'success')
      showInviteModal.value = false
      inviteForm.value = { email: '', role: 'AGENT' }
    }
  } catch (e: any) {
    inviteError.value = e.data?.message || 'Errore durante l\'invito'
  } finally {
    inviting.value = false
  }
}

const removeMember = async (id: string) => {
  if (!confirm('Sei sicuro di voler rimuovere questo utente dal team?')) return
  
  try {
    await $fetch(`/api/team/members/${id}`, { method: 'DELETE' })
    addToast('Utente rimosso', 'success')
    await fetchMembers()
  } catch (e: any) {
    addToast(e.data?.message || 'Errore durante la rimozione', 'error')
  }
}

onMounted(() => {
  fetchTeam()
  fetchMembers()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
