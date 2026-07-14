## Privacy & GDPR Inbound Webhooks
- **DRY Principle per Opt-Out**: Quando si aggiunge o si modifica un webhook per provider di messaggistica (WhatsApp, SMS, ecc.), **NON hardcodare mai** le regole di opt-out all'interno dell'endpoint.
- **Uso Policy Centralizzata**: Invocare sempre una funzione centralizzata (es. `lib/whatsapp-policy.ts` tramite `handleOptOutKeywords`) per parsare il contenuto testuale.
- **Fail-Safe su "STOP"**: Il comando generico "STOP" deve sempre disabilitare *tutte* le tipologie di comunicazioni (marketing + transazionali) per garantire la massima compliance. Mantenere varianti granulari come "STOP MARKETING" opzionali.

## Stack Tecnologico e Architettura (WaForge)
- **Frontend & Backend**: Nuxt 3 (Vue 3, Composition API per il client; Nitro Engine per le API server).
- **Database**: PostgreSQL gestito tramite **Prisma ORM**. 
- **Regola DB**: Prima di ogni modifica strutturale, aggiorna `prisma/schema.prisma` ed esegui `npx prisma db push` o `npx prisma migrate dev`.
- **Package Manager**: Puoi usare `npm` o `bun` in modo indifferente.

## Design System "Pro Connect" (Regola Rigida)
Qualsiasi nuovo componente visivo (Vue/Tailwind) DEVE seguire questi standard:
1. **Glassmorphism**: Usa sfondi traslucidi (es. `bg-surface-container/50 backdrop-blur-md`).
2. **Dark Mode Nativa**: Il sistema è "dark first". Usa costantemente le varianti `dark:` (es. `dark:bg-white/5`, `dark:border-white/10`).
3. **Brand Colors**: Usa il verde WhatsApp (`bg-primary`, `#25D366`) per call-to-action e bottoni principali.
4. **Layout Strutturale**: I container devono avere `border border-black/5 dark:border-white/5`, `rounded-2xl`, `shadow-xl`. I bottoni secondari usano `bg-surface-variant hover:bg-white/5 text-on-surface`.

## API e Sicurezza
- Le API (Nitro) devono sempre validare il `readBody(event)` utilizzando **Zod**.
- **Isolamento Dati**: Qualsiasi query al database o endpoint API deve essere strict-scoped sul `teamId` (`event.context.user.teamId`) per prevenire Broken Access Control.
- **Multilingua**: Evita testi hardcodati nei template Vue; favorisci l'uso di `$t('chiave')` tramite `@nuxtjs/i18n`.

## Build & Docker
- **Nuxt Sourcemaps**: Per le build Docker in produzione con Nuxt 3, disabilita sempre le sourcemap (`sourcemap: { server: false, client: false }` in `nuxt.config.ts`) per velocizzare la build e prevenire warning innocui (es. `nuxt:module-preload-polyfill`).

## Memoria di Sessione (Agent Persistence)
- **Aggiornamento MEMORY.md**: Al termine di ogni implementazione, o task complesso, l'agente DEVE sempre aggiornare il file `MEMORY.md`. 
- **Struttura obbligatoria**: Il file deve contenere un log strutturato ([Data] Titolo Task - Decisioni Architetturali - File Modificati). Usa sempre le skill di workflow ciclico (es. `workflow-production-cycle`), session manager e brainstorming. Questa memoria funge da contesto persistente per i futuri subagents.

## AI Output Rendering Standard (WaForge / Vue)
Quando si implementa un'interfaccia utente in Vue/Nuxt che deve mostrare testo generato da un LLM:
1. NON utilizzare mai `v-html` direttamente su output non parsato o non sanitizzato.
2. Utilizzare SEMPRE la triade: `marked` (per il parsing markdown), `highlight.js` (per i blocchi di codice), e `isomorphic-dompurify` (per prevenire XSS).
3. Incapsulare il rendering in un componente isolato (es. `AiMessageBubble.vue`) dotato di un pulsante "Copia" integrato in basso.

## Anthropic Design System & Chat-Centric UI (WaForge Dashboard)
1. Layout: L'applicazione principale deve utilizzare un paradigma "Chat-Centric" (stile ChatGPT web). La barra laterale (Sidebar) deve essere a scomparsa e l'area centrale deve essere focalizzata sull'interazione AI.
2. Tipografia (Anthropic Guidelines): Utilizzare sempre **Poppins** per le intestazioni (Headings) e **Lora** per il testo del corpo (Body).
3. Animazioni: Implementare sempre transizioni fluide e micro-animazioni per l'espansione dei menu e l'apparizione dei messaggi (`animate-fade-in`).
4. Input: I campi di testo principali per l'AI devono essere "Input Capsule" fluttuanti con pulsante di invio e supporto agli allegati.
