<template>
  <div class="p-6 max-w-4xl mx-auto">
    <div class="mb-8">
      <h1 class="text-2xl font-bold">Gestione Abbonamento</h1>
      <p class="text-on-surface-variant">Gestisci il tuo piano, i limiti del team e la fatturazione.</p>
      <div class="mt-2 text-xs text-primary flex gap-3">
        <span>✓ Carte di Credito</span>
        <span>✓ Apple/Google Pay</span>
        <span>✓ PayPal</span>
        <span>✓ Criptovalute (via Stripe)</span>
      </div>
    </div>

    <div v-if="loading" class="animate-pulse flex flex-col gap-4">
      <div class="h-32 bg-surface-variant/50 rounded-xl"></div>
      <div class="h-32 bg-surface-variant/50 rounded-xl"></div>
    </div>

    <div v-else-if="team" class="space-y-6">
      <!-- Current Plan Info -->
      <div class="bg-surface-container rounded-2xl p-6 border border-white/5">
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-xl font-bold mb-1">Piano Attuale: <span class="text-primary capitalize">{{ team.planTier }}</span></h2>
            <p class="text-on-surface-variant text-sm mb-4">
              Stato abbonamento: <span class="font-medium" :class="statusColor">{{ statusText }}</span>
            </p>
          </div>
          <div class="text-right">
            <button v-if="team.stripeCustomerId" @click="openCustomerPortal" :disabled="redirecting" class="px-4 py-2 bg-surface-variant hover:bg-surface-variant/80 rounded-lg text-sm font-medium transition-colors">
              {{ redirecting ? 'Reindirizzamento...' : 'Gestisci Fatturazione' }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div class="p-4 bg-surface-container-highest rounded-xl border border-white/5">
            <div class="text-sm text-on-surface-variant mb-1">Dispositivi WhatsApp</div>
            <div class="text-2xl font-bold">{{ usage.devices }} / {{ limits.devices === -1 ? '∞' : limits.devices }}</div>
          </div>
          <div class="p-4 bg-surface-container-highest rounded-xl border border-white/5">
            <div class="text-sm text-on-surface-variant mb-1">Contatti CRM</div>
            <div class="text-2xl font-bold">{{ usage.contacts }} / {{ limits.contacts === -1 ? '∞' : limits.contacts }}</div>
          </div>
        </div>
      </div>

      <!-- Upgrade Options -->
      <div v-if="team.planTier === 'FREE' || team.planTier === 'TRIAL'" class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div class="bg-surface-container rounded-2xl p-6 border border-white/5 relative flex flex-col">
          <h3 class="text-lg font-bold">Business</h3>
          <p class="text-on-surface-variant text-sm mb-4">Fino a 3 dispositivi e contatti illimitati.</p>
          <div class="text-3xl font-bold mb-6">€49<span class="text-sm font-normal text-on-surface-variant">/mese</span></div>
          <button @click="subscribe('PRO')" :disabled="redirecting" class="mt-auto w-full py-2.5 px-4 bg-primary text-black font-semibold rounded-lg hover:bg-primary-container transition-colors">
            Passa a Business
          </button>
        </div>
        
        <div class="bg-surface-container rounded-2xl p-6 border border-white/5 relative flex flex-col">
          <h3 class="text-lg font-bold">Enterprise</h3>
          <p class="text-on-surface-variant text-sm mb-4">Senza limiti per grandi volumi.</p>
          <div class="text-3xl font-bold mb-6">€149<span class="text-sm font-normal text-on-surface-variant">/mese</span></div>
          <button @click="subscribe('ENTERPRISE')" :disabled="redirecting" class="mt-auto w-full py-2.5 px-4 bg-primary text-black font-semibold rounded-lg hover:bg-primary-container transition-colors">
            Passa a Enterprise
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const team = ref<any>(null)
const usage = ref({ devices: 0, contacts: 0 })
const loading = ref(true)
const redirecting = ref(false)

const fetchBillingInfo = async () => {
  try {
    const res = await $fetch('/api/stripe/info')
    team.value = res.team
    usage.value = res.usage
  } catch (error) {
    console.error('Failed to load billing info:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchBillingInfo()
})

const limits = computed(() => {
  if (!team.value) return { devices: 1, contacts: 100 }
  switch(team.value.planTier) {
    case 'PRO': return { devices: 3, contacts: -1 }
    case 'ENTERPRISE': return { devices: -1, contacts: -1 }
    default: return { devices: 1, contacts: 100 }
  }
})

const statusText = computed(() => {
  if (team.value?.subscriptionStatus === 'active') return 'Attivo'
  if (team.value?.subscriptionStatus === 'past_due') return 'Pagamento in Sospeso'
  if (team.value?.subscriptionStatus === 'canceled') return 'Cancellato'
  return 'Gratuito / Trial'
})

const statusColor = computed(() => {
  if (team.value?.subscriptionStatus === 'active') return 'text-primary'
  if (team.value?.subscriptionStatus === 'past_due') return 'text-warning'
  if (team.value?.subscriptionStatus === 'canceled') return 'text-error'
  return 'text-on-surface-variant'
})

const subscribe = async (tier: string) => {
  redirecting.value = true
  try {
    const res = await $fetch('/api/stripe/checkout', {
      method: 'POST',
      body: { tier }
    })
    if (res.url) window.location.href = res.url
  } catch (error) {
    console.error('Checkout failed', error)
    alert('Errore di connessione a Stripe.')
    redirecting.value = false
  }
}

const openCustomerPortal = async () => {
  redirecting.value = true
  try {
    const res = await $fetch('/api/stripe/portal', { method: 'POST' })
    if (res.url) window.location.href = res.url
  } catch (error) {
    console.error('Portal failed', error)
    alert('Errore di connessione al Customer Portal.')
    redirecting.value = false
  }
}
</script>
