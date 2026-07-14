<template>
  <div class="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-on-surface-variant shrink-0">
    <div class="flex items-center justify-between mb-2 font-semibold text-on-surface">
      <span class="flex items-center gap-1.5"><Info class="w-3.5 h-3.5 text-primary"/> Legenda Formattazione Ufficiale WhatsApp</span>
      <span class="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 font-mono">Spintax: {A|B|C}</span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] opacity-90">
      <div class="space-y-1 bg-black/20 p-2 rounded-lg border border-white/5">
        <div class="font-bold text-on-surface text-[10px] uppercase text-primary/80 mb-1">Stile Testo Ufficiale</div>
        <div><code>*grassetto*</code> → <b>grassetto</b></div>
        <div><code>_corsivo_</code> → <i>corsivo</i></div>
        <div><code>~barrato~</code> → <s>barrato</s></div>
        <div><code>```monospazio```</code> → <code class="bg-black/40 px-1 py-0.5 rounded">monospazio</code></div>
        <div><code>> citazione</code> → <span class="border-l-2 border-primary pl-1 italic">citazione</span></div>
        <div><code>- elemento</code> → <span class="pl-1">• elenco puntato</span></div>
      </div>
      <div class="space-y-1 bg-black/20 p-2 rounded-lg border border-white/5">
        <div class="font-bold text-on-surface text-[10px] uppercase text-primary/80 mb-1">Variabili Dinamiche & Spintax</div>
        <div><code class="text-primary">{{Name}}</code> → Nome del contatto</div>
        <div><code class="text-primary">{{Phone}}</code> → Numero di telefono</div>
        <div><code class="text-primary">{{Company}}</code> → Azienda / Team</div>
        <div><code class="text-primary">{{Email}}</code> → Email cliente</div>
        <div class="pt-1 text-[10px] text-on-surface-variant/80 border-t border-white/5">
          Esempio: <code>*{Ciao|Salve} {{Name}}*! Ti va di...</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next'
</script>
