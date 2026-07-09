<template>
  <div v-if="!hasConsented" class="fixed bottom-0 left-0 w-full z-50 p-4 animate-slide-up">
    <div class="max-w-5xl mx-auto bg-surface-container-high border border-white/20 rounded-2xl shadow-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-xl">
      <div class="flex-1">
        <h4 class="text-on-surface font-bold text-lg mb-2">Informativa sui Cookie</h4>
        <p class="text-sm text-on-surface-variant">
          Utilizziamo cookie tecnici essenziali per il funzionamento della dashboard e cookie analitici anonimizzati per migliorare il nostro servizio. 
          Puoi accettarli tutti o continuare solo con quelli strettamente necessari. 
          Leggi la nostra <NuxtLink to="/legal?tab=cookie" class="text-primary hover:underline">Cookie Policy</NuxtLink> per maggiori dettagli.
        </p>
      </div>
      <div class="flex items-center gap-3 w-full md:w-auto">
        <button @click="acceptEssential" class="flex-1 md:flex-none px-4 py-2.5 text-sm font-semibold text-on-surface-variant hover:text-on-surface border border-white/10 hover:bg-white/5 rounded-lg transition-colors">
          Solo Necessari
        </button>
        <button @click="acceptAll" class="flex-1 md:flex-none px-5 py-2.5 text-sm font-semibold bg-primary text-on-primary hover:bg-primary-hover shadow-[0_0_15px_rgba(37,211,102,0.3)] rounded-lg transition-all">
          Accetta Tutti
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const hasConsented = ref(true)

onMounted(() => {
  const consent = localStorage.getItem('waforge_cookie_consent')
  if (!consent) {
    hasConsented.value = false
  }
})

function acceptAll() {
  localStorage.setItem('waforge_cookie_consent', 'all')
  hasConsented.value = true
}

function acceptEssential() {
  localStorage.setItem('waforge_cookie_consent', 'essential')
  hasConsented.value = true
}
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.5s ease-out forwards;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
