<template>
  <div class="p-6 max-w-5xl mx-auto space-y-8 animate-fade-in">
    <div class="mb-4 flex flex-col md:flex-row md:justify-between md:items-start gap-4">
      <div>
        <h1 class="text-3xl font-bold text-on-surface">Gestione Abbonamento</h1>
        <p class="text-on-surface-variant mt-1">Gestisci il tuo piano, i limiti e lo storico fatture.</p>
      </div>
      <button v-if="team?.stripeCustomerId" @click="openCustomerPortal" :disabled="redirecting" class="px-5 py-2.5 bg-surface-variant hover:bg-surface-variant/80 rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
        <CreditCard class="w-4 h-4" />
        {{ redirecting ? 'Reindirizzamento...' : 'Gestisci su Stripe' }}
      </button>
    </div>

    <div v-if="loading" class="animate-pulse space-y-6">
      <div class="h-40 bg-surface-variant/50 rounded-2xl"></div>
      <div class="h-64 bg-surface-variant/50 rounded-2xl"></div>
    </div>

    <template v-else-if="team">
      <!-- Piano & Limiti -->
      <div class="bg-surface-container/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
        <div class="flex flex-col md:flex-row gap-8 justify-between">
          <div class="flex-1">
            <h2 class="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Piano Attuale</h2>
            <div class="text-4xl font-bold text-on-surface capitalize mb-2">{{ team.planTier }}</div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10" :class="statusColor">
              <span class="w-2 h-2 rounded-full bg-current"></span> {{ statusText }}
            </div>
            
            <div class="mt-8">
              <h3 class="text-sm font-medium text-on-surface-variant mb-4">Utilizzo Risorse</h3>
              <div class="space-y-4">
                <!-- Contacts Bar -->
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-on-surface">Contatti CRM</span>
                    <span class="text-on-surface-variant font-medium">{{ usage.contacts }} / {{ limits.contacts === -1 ? '∞' : limits.contacts }}</span>
                  </div>
                  <div class="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                    <div class="h-full bg-primary rounded-full transition-all duration-1000" :style="{ width: getPercentage(usage.contacts, limits.contacts) + '%' }"></div>
                  </div>
                </div>
                <!-- Devices Bar -->
                <div>
                  <div class="flex justify-between text-xs mb-1">
                    <span class="text-on-surface">Dispositivi WhatsApp</span>
                    <span class="text-on-surface-variant font-medium">{{ usage.devices }} / {{ limits.devices === -1 ? '∞' : limits.devices }}</span>
                  </div>
                  <div class="h-2 w-full bg-black/20 rounded-full overflow-hidden">
                    <div class="h-full bg-secondary rounded-full transition-all duration-1000" :style="{ width: getPercentage(usage.devices, limits.devices) + '%' }"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Upgrade Banner per Free -->
          <div v-if="team.planTier === 'FREE' || team.planTier === 'TRIAL'" class="flex-1 bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-center">
            <div class="absolute -right-10 -top-10 text-primary/10 blur-xl">
              <Rocket class="w-48 h-48" />
            </div>
            <h3 class="text-xl font-bold text-on-surface mb-2 relative z-10">Fai l'upgrade al piano PRO</h3>
            <p class="text-sm text-on-surface-variant mb-6 relative z-10">Sblocca contatti illimitati, automazioni avanzate e rimuovi il limite di dispositivi connessi.</p>
            <button @click="openCheckout" class="px-5 py-3 bg-primary text-surface font-semibold rounded-xl hover:bg-primary-fixed-dim transition-colors relative z-10 inline-flex items-center justify-center gap-2 w-full md:w-auto">
              <Zap class="w-4 h-4" /> Scopri i Piani
            </button>
          </div>
        </div>
      </div>

      <!-- Fatture Storico -->
      <div class="space-y-4">
        <h3 class="text-xl font-bold text-on-surface">Storico Fatture</h3>
        
        <div v-if="loadingInvoices" class="animate-pulse h-32 bg-white/5 rounded-2xl"></div>
        
        <div v-else-if="invoices.length === 0" class="text-center p-12 border border-dashed border-white/10 rounded-3xl">
          <FileText class="w-12 h-12 text-on-surface-variant/50 mx-auto mb-3" />
          <h4 class="text-lg font-medium text-on-surface mb-1">Nessuna fattura disponibile</h4>
          <p class="text-sm text-on-surface-variant">Le tue ricevute e fatture appariranno qui non appena avrai un abbonamento attivo.</p>
        </div>

        <div v-else class="bg-surface-container border border-white/10 rounded-2xl overflow-hidden overflow-x-auto">
          <table class="w-full text-left text-sm whitespace-nowrap">
            <thead class="bg-black/20 text-on-surface-variant">
              <tr>
                <th class="px-6 py-4 font-medium">Data</th>
                <th class="px-6 py-4 font-medium">Numero</th>
                <th class="px-6 py-4 font-medium">Importo</th>
                <th class="px-6 py-4 font-medium">Stato</th>
                <th class="px-6 py-4 font-medium text-right">Azione</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-white/5 transition-colors">
                <td class="px-6 py-4 text-on-surface">{{ new Date(inv.date).toLocaleDateString() }}</td>
                <td class="px-6 py-4 font-mono text-on-surface-variant">{{ inv.number || 'N/A' }}</td>
                <td class="px-6 py-4 font-medium text-on-surface">{{ (inv.amount / 100).toFixed(2) }} {{ inv.currency.toUpperCase() }}</td>
                <td class="px-6 py-4">
                  <span class="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        :class="inv.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'">
                    {{ inv.status }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <a v-if="inv.pdf" :href="inv.pdf" target="_blank" class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-on-surface rounded-lg transition-colors">
                    <Download class="w-3.5 h-3.5" /> PDF
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { CreditCard, Download, FileText, Rocket, Zap } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

const loading = ref(true)
const team = ref<any>(null)
const usage = ref({ contacts: 0, devices: 0 })
const limits = ref({ contacts: 500, devices: 1 })
const redirecting = ref(false)

const invoices = ref<any[]>([])
const loadingInvoices = ref(false)

const statusText = computed(() => {
  if (!team.value) return 'Sconosciuto'
  if (team.value.planTier === 'FREE') return 'Gratuito'
  if (team.value.subscriptionStatus === 'active') return 'Attivo'
  if (team.value.subscriptionStatus === 'past_due') return 'Pagamento in Sospeso'
  if (team.value.subscriptionStatus === 'canceled') return 'Cancellato'
  return 'Sconosciuto'
})

const statusColor = computed(() => {
  if (!team.value) return 'text-gray-400'
  if (team.value.planTier === 'FREE') return 'text-gray-400'
  if (team.value.subscriptionStatus === 'active') return 'text-green-400'
  if (team.value.subscriptionStatus === 'past_due') return 'text-amber-400'
  if (team.value.subscriptionStatus === 'canceled') return 'text-red-400'
  return 'text-gray-400'
})

const getPercentage = (val: number, max: number) => {
  if (max === -1) return 0
  return Math.min(100, Math.round((val / max) * 100))
}

const fetchData = async () => {
  try {
    const res = await $fetch('/api/stripe/info', {
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    team.value = res.team
    usage.value = res.usage
    limits.value = res.limits
    
    // Fetch invoices se lo stripe customer ID esiste
    if (team.value?.stripeCustomerId) {
      loadingInvoices.value = true
      const invRes = await $fetch('/api/stripe/invoices', {
        headers: { Authorization: `Bearer ${authStore.token}` }
      })
      invoices.value = invRes.invoices || []
      loadingInvoices.value = false
    }
  } catch (e) {
    console.error(e)
  }
  loading.value = false
}

const openCustomerPortal = async () => {
  if (redirecting.value) return
  redirecting.value = true
  try {
    const res = await $fetch('/api/stripe/portal', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authStore.token}` }
    })
    if (res.url) window.location.href = res.url
  } catch (e) {
    alert("Errore nell'apertura del portale.")
  }
  redirecting.value = false
}

const openCheckout = async () => {
  // redirect a /pricing o stripe checkout
  alert("Implementazione Checkout a seguire.")
}

onMounted(() => {
  fetchData()
})
</script>
