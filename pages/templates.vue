<template>
  <div class="p-8 space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <h1 class="text-3xl font-bold text-on-surface tracking-tight">{{ t('nav.templates') }}</h1>
      <button @click="openWizard()"
              class="px-5 py-2.5 bg-primary text-on-primary font-semibold rounded-lg shadow-[0_0_15px_rgba(37,211,102,0.3)] hover:shadow-[0_0_25px_rgba(37,211,102,0.5)] transition-all flex items-center gap-2">
        <Plus class="w-5 h-5" /> Nuovo Template
      </button>
    </div>

    <!-- Templates List -->
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-if="store.loading" v-for="i in 3" :key="i" class="bg-surface-container/40 border border-white/10 rounded-2xl p-6">
        <div class="h-5 bg-white/5 rounded w-1/3 animate-pulse mb-3"></div>
        <div class="h-16 bg-white/5 rounded w-full animate-pulse"></div>
      </div>

      <div v-else v-for="tmpl in store.templates" :key="tmpl.id"
           class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold text-on-surface text-lg">{{ tmpl.name }}</h3>
            <div class="flex gap-2">
              <button @click="openWizard(tmpl)" class="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-on-surface transition-colors">
                <Edit2 class="w-4 h-4" />
              </button>
              <button @click="handleDelete(tmpl.id)" class="p-2 rounded-lg bg-error/10 hover:bg-error/20 text-error transition-colors">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
          <p class="text-xs text-on-surface-variant mb-4">{{ tmpl.description || 'Nessuna descrizione' }}</p>
          <div class="bg-black/20 p-3 rounded-lg border border-white/5 max-h-32 overflow-y-auto">
            <div class="text-sm text-on-surface whitespace-pre-wrap leading-relaxed" v-html="formatWhatsAppText(tmpl.body)"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Teleport to="body">
      <div v-if="showWizard" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" @click.self="showWizard = false">
        <div class="w-full max-w-2xl bg-surface-container-high border border-white/10 rounded-2xl p-6 shadow-2xl animate-slide-in">
          <h3 class="text-lg font-bold text-on-surface mb-6">{{ isEditing ? 'Modifica Template' : 'Crea Nuovo Template' }}</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-on-surface-variant mb-1">Nome</label>
              <input v-model="formData.name" type="text" placeholder="Es: Messaggio Benvenuto"
                     class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
            </div>

            <div>
              <label class="block text-sm font-medium text-on-surface-variant mb-1">Descrizione (opzionale)</label>
              <input v-model="formData.description" type="text" placeholder="Note interne..."
                     class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none" />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-on-surface-variant mb-1">Testo Messaggio</label>
                <textarea v-model="formData.body" rows="6" placeholder="Usa {{Name}} per il nome del contatto. *grassetto*, _corsivo_, ~barrato~"
                          class="w-full p-3 bg-black/30 border border-white/10 rounded-lg text-on-surface text-sm focus:border-primary outline-none whitespace-pre-wrap"></textarea>
                <p class="text-xs text-on-surface-variant mt-1">Variabili supportate: {{Name}}, {{Phone}}, {{Email}}, {{Company}}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-on-surface-variant mb-1">Anteprima</label>
                <div class="w-full p-3 bg-black/20 border border-white/5 rounded-lg h-[156px] overflow-y-auto">
                  <div class="text-sm text-on-surface whitespace-pre-wrap leading-relaxed" v-html="formatWhatsAppText(formData.body)"></div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 mt-6">
            <button @click="showWizard = false" class="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface transition-colors">Annulla</button>
            <button @click="handleSave" :disabled="!formData.name || !formData.body"
                    class="px-5 py-2 bg-primary text-on-primary font-semibold rounded-lg hover:bg-primary-fixed-dim transition-all disabled:opacity-30">
              Salva Template
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Plus, Edit2, Trash2 } from 'lucide-vue-next'
import { useI18n } from '#i18n'
import { useTemplatesStore, type Template } from '~/stores/templates'

const { t } = useI18n()
const store = useTemplatesStore()

const showWizard = ref(false)
const isEditing = ref(false)
const formData = ref({ id: '', name: '', description: '', body: '' })

function formatWhatsAppText(text: string) {
  if (!text) return ''
  return text
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~(.*?)~/g, '<del>$1</del>')
}

function openWizard(tmpl?: Template) {
  if (tmpl) {
    isEditing.value = true
    formData.value = { ...tmpl, description: tmpl.description || '' }
  } else {
    isEditing.value = false
    formData.value = { id: '', name: '', description: '', body: '' }
  }
  showWizard.value = true
}

async function handleSave() {
  if (isEditing.value) {
    await store.updateTemplate(formData.value.id, formData.value)
  } else {
    await store.createTemplate(formData.value)
  }
  showWizard.value = false
}

async function handleDelete(id: string) {
  if (confirm('Sei sicuro di voler eliminare questo template?')) {
    await store.deleteTemplate(id)
  }
}

onMounted(() => {
  store.fetchTemplates()
})
</script>
