<template>
  <div class="flex h-full w-full overflow-x-auto gap-4 pb-4 snap-x">
    
    <!-- Inbox / Unassigned Column -->
    <div 
      class="flex flex-col min-w-[320px] max-w-[320px] bg-surface-container-low/50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 snap-start shrink-0"
      @dragover.prevent
      @drop="onDrop($event, null)"
    >
      <div class="p-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between sticky top-0 bg-inherit z-10 rounded-t-xl">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: unassigned.color }"></div>
          <h3 class="font-heading font-semibold text-sm">{{ unassigned.name }}</h3>
          <span class="text-xs bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full text-on-surface-variant">{{ unassigned._count.contacts }}</span>
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2 space-y-2 min-h-[150px]">
        <div 
          v-for="contact in unassigned.contacts" :key="contact.id"
          draggable="true"
          @dragstart="onDragStart($event, contact, null)"
          @click="$emit('contact-click', contact.id)"
          class="bg-surface border border-black/5 dark:border-white/10 p-3 rounded-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group"
        >
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-medium text-sm text-on-surface group-hover:text-primary transition-colors">{{ contact.name }}</h4>
            <span v-if="contact.company" class="text-[10px] uppercase tracking-wider text-on-surface-variant bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded">{{ contact.company }}</span>
          </div>
          <p class="text-xs text-on-surface-variant flex items-center gap-1"><Phone class="w-3 h-3"/> {{ contact.phone }}</p>
          <div v-if="contact.labels" class="mt-2 flex flex-wrap gap-1">
            <span v-for="label in parseLabels(contact.labels)" :key="label" class="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">{{ label }}</span>
          </div>
        </div>
        <div v-if="unassigned.contacts.length === 0" class="text-center p-4 text-sm text-on-surface-variant italic opacity-50">
          Nessun contatto
        </div>
      </div>
    </div>

    <!-- Pipeline Stages Columns -->
    <div 
      v-for="stage in stages" :key="stage.id"
      class="flex flex-col min-w-[320px] max-w-[320px] bg-surface-container-low/50 dark:bg-black/20 rounded-xl border border-black/5 dark:border-white/5 snap-start shrink-0"
      @dragover.prevent
      @drop="onDrop($event, stage.id)"
    >
      <div class="p-3 border-b border-black/5 dark:border-white/5 flex items-center justify-between sticky top-0 bg-inherit z-10 rounded-t-xl">
        <div class="flex items-center gap-2">
          <div class="w-3 h-3 rounded-full" :style="{ backgroundColor: stage.color }"></div>
          <h3 class="font-heading font-semibold text-sm">{{ stage.name }}</h3>
          <span class="text-xs bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full text-on-surface-variant">{{ stage._count.contacts }}</span>
        </div>
        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <!-- TODO: edit stage -->
        </div>
      </div>
      
      <div class="flex-1 overflow-y-auto p-2 space-y-2 min-h-[150px]">
        <div 
          v-for="contact in stage.contacts" :key="contact.id"
          draggable="true"
          @dragstart="onDragStart($event, contact, stage.id)"
          @click="$emit('contact-click', contact.id)"
          class="bg-surface border border-black/5 dark:border-white/10 p-3 rounded-lg shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden"
        >
          <!-- Accent bar -->
          <div class="absolute left-0 top-0 bottom-0 w-1 opacity-50" :style="{ backgroundColor: stage.color }"></div>
          
          <div class="flex justify-between items-start mb-2 pl-2">
            <h4 class="font-medium text-sm text-on-surface group-hover:text-primary transition-colors truncate max-w-[180px]">{{ contact.name }}</h4>
            <span v-if="contact.company" class="text-[10px] uppercase tracking-wider text-on-surface-variant bg-black/5 dark:bg-white/5 px-1.5 py-0.5 rounded truncate max-w-[80px]">{{ contact.company }}</span>
          </div>
          <p class="text-xs text-on-surface-variant flex items-center gap-1 pl-2"><Phone class="w-3 h-3"/> {{ contact.phone }}</p>
          <div v-if="contact.labels" class="mt-2 pl-2 flex flex-wrap gap-1">
            <span v-for="label in parseLabels(contact.labels)" :key="label" class="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">{{ label }}</span>
          </div>
        </div>
        <div v-if="stage.contacts.length === 0" class="text-center p-4 text-sm text-on-surface-variant italic opacity-50">
          Nessun contatto
        </div>
      </div>
    </div>
    
    <!-- Add Stage Column -->
    <div class="flex flex-col min-w-[320px] max-w-[320px] snap-start shrink-0">
       <button @click="$emit('add-stage')" class="w-full h-full min-h-[150px] border-2 border-dashed border-black/10 dark:border-white/10 rounded-xl flex flex-col items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-colors">
         <Plus class="w-6 h-6 mb-2" />
         <span class="text-sm font-medium">Aggiungi Fase</span>
       </button>
    </div>

  </div>
</template>

<script setup lang="ts">
import { Phone, Plus } from 'lucide-vue-next'
import type { PipelineStage, CrmContactCard } from '~/stores/crm'

const props = defineProps<{
  stages: PipelineStage[]
  unassigned: any
}>()

const emit = defineEmits(['move', 'contact-click', 'add-stage'])

function parseLabels(labelsString: string | null) {
  if (!labelsString) return []
  try {
    return JSON.parse(labelsString)
  } catch (e) {
    return []
  }
}

// Drag & Drop Handlers
function onDragStart(event: DragEvent, contact: CrmContactCard, sourceStageId: string | null) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', JSON.stringify({ contactId: contact.id, sourceStageId }))
  }
}

function onDrop(event: DragEvent, targetStageId: string | null) {
  if (event.dataTransfer) {
    const data = event.dataTransfer.getData('text/plain')
    if (data) {
      try {
        const parsed = JSON.parse(data)
        if (parsed.sourceStageId !== targetStageId) {
          emit('move', parsed.contactId, targetStageId)
        }
      } catch (e) {
        console.error('Drop error', e)
      }
    }
  }
}
</script>
