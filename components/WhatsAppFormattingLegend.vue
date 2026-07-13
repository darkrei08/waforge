<template>
  <div class="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-on-surface-variant shrink-0">
    <div class="flex items-center justify-between mb-1 font-semibold text-on-surface">
      <span class="flex items-center gap-1.5"><Info class="w-3.5 h-3.5 text-primary"/> Variabili & WhatsApp Formatting</span>
      <span class="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">Spintax: {A|B}</span>
    </div>
    <div class="grid grid-cols-2 gap-2 text-[11px] opacity-80 mt-1.5">
      <div>
        <code>{{Name}}</code>, <code>{{Phone}}</code>, <code>{{Email}}</code>, <code>{{Company}}</code>
      </div>
      <div>
        <code>*grassetto*</code>, <code>_corsivo_</code>, <code>~barrato~</code>, <code>```codice```</code>, <code>`codice inline`</code>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next'
</script>
