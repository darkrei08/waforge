<template>
  <div class="min-h-screen bg-background p-8">
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <NuxtLink to="/" class="text-primary hover:underline text-sm flex items-center gap-2 mb-4">
          &larr; Torna alla Dashboard
        </NuxtLink>
        <h1 class="text-3xl font-bold text-on-surface">Area Legale & Compliance</h1>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-white/10 mb-8">
        <button v-for="t in tabs" :key="t.id"
                @click="activeTab = t.id"
                class="px-6 py-3 text-sm font-semibold transition-colors border-b-2"
                :class="activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'">
          {{ t.label }}
        </button>
      </div>

      <!-- Content -->
      <div class="prose prose-invert max-w-none text-on-surface-variant">
        <div v-if="activeTab === 'privacy'">
          <h2>Privacy Policy (GDPR)</h2>
          <p>La presente Privacy Policy descrive le modalità di gestione dei dati personali degli utenti e dei contatti importati sulla piattaforma WaForge, in ottemperanza all'Art. 13 e 14 del Regolamento (UE) 2016/679 (GDPR).</p>
          
          <h3>1. Titolare del Trattamento</h3>
          <p>Il titolare del trattamento è il proprietario dell'istanza WaForge. Essendo WaForge un software self-hosted fornito "as-is", le responsabilità del trattamento ricadono su chi lo installa ed espone.</p>

          <h3>2. Dati Trattati e Finalità</h3>
          <ul>
            <li><strong>Dati dell'account:</strong> Nome, Email, Password (hash) per l'accesso e la gestione del team (Art. 6.1.b GDPR).</li>
            <li><strong>Dati Contatti (CRM):</strong> Numeri di telefono, nomi e informazioni custom caricati dall'utente per l'invio di campagne marketing o comunicazioni operative.</li>
          </ul>

          <h3>3. Condivisione dei Dati (Sub-responsabili)</h3>
          <p>I messaggi in uscita tramite questa piattaforma sono inviati verso l'ecosistema WhatsApp. Pertanto, WhatsApp LLC e Meta Platforms Ireland Ltd. agiscono come sub-responsabili limitatamente all'infrastruttura di recapito.</p>

          <h3>4. Periodo di Conservazione (Data Retention)</h3>
          <p>WaForge è equipaggiato con un sistema di pulizia automatizzata. I contatti inattivi da oltre 24 mesi vengono eliminati o anonimizzati automaticamente dal sistema a tutela del principio di minimizzazione.</p>

          <h3>5. Diritti dell'Interessato</h3>
          <p>Gli utenti hanno il diritto di richiedere l'accesso, la rettifica, la cancellazione (oblio), la limitazione e l'opposizione al trattamento (Artt. 15-22 GDPR).</p>
        </div>

        <div v-if="activeTab === 'cookie'">
          <h2>Cookie Policy</h2>
          <p>Il sito/dashboard di WaForge utilizza cookie per garantire il corretto funzionamento delle procedure e migliorare l'esperienza d'uso.</p>

          <h3>Cookie Tecnici Essenziali</h3>
          <p>Sono necessari al corretto funzionamento della piattaforma (es. mantenimento della sessione utente, autenticazione JWT, preferenze lingua/UI). Senza questi cookie la piattaforma non è utilizzabile. (Base giuridica: legittimo interesse / servizio richiesto).</p>
          <ul>
            <li><code>auth_token</code>: Cookie HttpOnly per il mantenimento della sessione.</li>
            <li><code>waforge_cookie_consent</code>: Salva la tua preferenza su questo banner.</li>
          </ul>

          <h3>Cookie Analitici (Se abilitati)</h3>
          <p>Permettono di comprendere come gli utenti interagiscono con la piattaforma, raccogliendo informazioni in forma aggregata e anonima.</p>
        </div>

        <div v-if="activeTab === 'terms'">
          <h2>Termini e Condizioni d'Uso (T&C)</h2>
          <p>L'utilizzo del software WaForge è soggetto all'accettazione dei seguenti termini e condizioni.</p>
          
          <h3>1. Licenza d'Uso</h3>
          <p>Il software è fornito con le relative licenze MIT o proprietarie in base alla distribuzione. L'utente si impegna a non utilizzare il software per scopi illeciti o invio di SPAM massivo non autorizzato.</p>

          <h3>2. Regole Anti-Spam (WhatsApp)</h3>
          <p>L'utente dichiara di aver acquisito esplicito consenso (Opt-in) per l'invio di comunicazioni promozionali o operative verso i numeri importati nel CRM, e si impegna a rispettare le Policy Commerce e Business di WhatsApp LLC.</p>

          <h3>3. Limitazione di Responsabilità</h3>
          <p>Lo sviluppatore del software WaForge non è responsabile per eventuali ban del numero WhatsApp derivanti dall'utilizzo della piattaforma in violazione delle condizioni imposte da Meta. L'utente riconosce di utilizzare l'applicativo a proprio rischio e pericolo.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { id: 'privacy', label: 'Privacy Policy' },
  { id: 'cookie', label: 'Cookie Policy' },
  { id: 'terms', label: 'Termini & Condizioni' }
]

const activeTab = ref('privacy')

onMounted(() => {
  if (route.query.tab && tabs.find(t => t.id === route.query.tab)) {
    activeTab.value = route.query.tab as string
  }
})
</script>
