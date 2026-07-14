<template>
  <div class="mt-4 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-on-surface-variant shrink-0 w-full">
    <div class="flex items-center justify-between mb-2.5 font-semibold text-on-surface">
      <span class="flex items-center gap-1.5"><Info class="w-3.5 h-3.5 text-primary"/> Legenda Formattazione Ufficiale WhatsApp</span>
      <span class="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 font-mono">Spintax: {A|B|C}</span>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px] opacity-95">
      <div class="space-y-1.5 bg-black/20 p-2.5 rounded-lg border border-white/5 flex flex-col justify-between h-full">
        <div>
          <div class="font-bold text-on-surface text-[10px] uppercase tracking-wider text-primary mb-1.5">Stile Testo Ufficiale</div>
          <div class="space-y-1">
            <div class="flex items-center justify-between"><code>*grassetto*</code> <span class="font-bold text-on-surface">grassetto</span></div>
            <div class="flex items-center justify-between"><code>_corsivo_</code> <span class="italic text-on-surface">corsivo</span></div>
            <div class="flex items-center justify-between"><code>~barrato~</code> <span class="line-through text-on-surface">barrato</span></div>
            <div class="flex items-center justify-between"><code>```monospazio```</code> <span class="font-mono bg-black/40 px-1 py-0.5 rounded text-[10px] text-primary">monospazio</span></div>
            <div class="flex items-center justify-between"><code>> citazione</code> <span class="border-l-2 border-primary pl-1.5 italic text-on-surface">citazione</span></div>
            <div class="flex items-center justify-between"><code>- elemento</code> <span class="text-on-surface">• elenco puntato</span></div>
            <div class="flex items-center justify-between"><code>1. elemento</code> <span class="text-on-surface">1. elenco numerato</span></div>
          </div>
        </div>
      </div>
      <div class="space-y-1.5 bg-black/20 p-2.5 rounded-lg border border-white/5 flex flex-col justify-between h-full">
        <div>
          <div class="font-bold text-on-surface text-[10px] uppercase tracking-wider text-primary mb-1.5">Variabili Dinamiche & Spintax</div>
          <div class="space-y-1">
            <div class="flex items-center justify-between"><code class="text-primary font-mono">{{Name}}</code> <span class="text-on-surface">Nome contatto</span></div>
            <div class="flex items-center justify-between"><code class="text-primary font-mono">{{Phone}}</code> <span class="text-on-surface">Numero telefono</span></div>
            <div class="flex items-center justify-between"><code class="text-primary font-mono">{{Company}}</code> <span class="text-on-surface">Azienda / Team</span></div>
            <div class="flex items-center justify-between"><code class="text-primary font-mono">{{Email}}</code> <span class="text-on-surface">Email cliente</span></div>
            <div class="flex items-center justify-between"><code class="text-primary font-mono">{Ciao|Salve}</code> <span class="text-on-surface">Spintax random</span></div>
          </div>
        </div>
        <div class="pt-2 mt-2 text-[10px] text-on-surface-variant/90 border-t border-white/5 bg-white/[0.02] p-1.5 rounded">
          <span class="text-primary font-semibold">Esempio:</span> <code>*{Ciao|Salve} {{Name}}*! Ti inviamo...</code>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Info } from 'lucide-vue-next'
</script>
