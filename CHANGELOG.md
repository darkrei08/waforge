# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.15.1] - 2026-07-13

### Fixed
- **UI & Legenda Formattazione**: Rimossa la duplicazione della legenda WhatsApp (variabili e formattazione grassetto/corsivo) nei file `campaigns.vue` e `templates.vue`, unificata tramite il componente `WhatsAppFormattingLegend.vue`.
- **Dispositivi Fantasma (Ghost Devices)**: Risolto il problema in `/devices` in cui un tentativo di connessione interrotto senza scansionare il QR code lasciava un dispositivo perennemente visibile ("In attesa..."). Le sessioni vuote ora vengono filtrate e pulite automaticamente nel database dal cron `retention.ts` ogni ora.
- **Denominazione Progetto Standardizzata**: Tutti i riferimenti legacy (Center Pro, One Forge Pro, WA Sender Pro) nel codice, documentazione, `MEMORY.md` e nel report sono stati aggiornati alla denominazione standard ufficiale **WaForge**.

## [2.15.0] - 2026-07-12

### Added
- **OpenWA Engine Integration (`OPENWA-01`)**: Integrato il terzo framework di gestione WhatsApp, [OpenWA](https://github.com/rmyndharis/OpenWA) (basato su Node.js e Baileys `docker.io/rmyndharis/openwa:latest` / `ghcr.io/rmyndharis/openwa:latest`), esposto in `docker-compose.yml` sulla porta `2785`.
- **Hybrid Multi-Engine Load Balancer & Failover (`HYBRID-01`)**: Riprogettato il core in `lib/whatsapp-engine.ts` introducendo la modalità `hybrid`. Quando `WHATSAPP_ENGINE=hybrid`, il sistema individua automaticamente i motori attivi (`WuzAPI`, `GoWA`, `OpenWA`) ed esegue bilanciamento del carico Round-Robin sui messaggi in uscita e failover automatico (ritentando sui successivi motori se un invio fallisce o il motore principale è disconnesso). Ottimale per evitare blocchi e spalmare il traffico di campagne intensive su più sessioni e device.
- **Docker & Compose Modernization**: Aggiunto re-indirizzamento dinamico con `expose` sui servizi Docker ed eliminata la verbosità nelle etichette Traefik usando il formato `key: "value"` con spazi puliti (`labels:` syntax). Explicit debug widget enablement per client (`NUXT_PUBLIC_ENABLE_DEBUG_WIDGET=true`).
- **Admin Password Recovery Tool (`bin/reset-admin-password.ts`)**: Creata l'utility CLI per ripristino sicuro delle password amministrative e verifica utenti nel database (`bun run admin:reset-password --email <email> --password <pass>`).
- **Always-on Debug Widget UI**: Garantita la visibilità costante del `DebugWidget` (`app.vue`), con aggiunta di pulsante flottante di richiamo rapido (`🐞 Debugger`) in basso a destra.
- **Smart Cockpit Proxy Failover & Resilience**: Auto-routing e failover intelligente su API provider in `generate.post.ts` per chiamate LLM in caso di momentanea indisponibilità del proxy HTTP locale di Cockpit (`:19528`).

## [2.14.1] - 2026-07-12

### Fixed
- **SSE 400 Bad Request & Chat History Corruption (`CRIT-01`)**: Risolto in `pages/templates.vue` l'invio di `chatHistory` all'API che includeva messaggi temporanei terminanti con `role: 'assistant'`. Ora la UI di caricamento ("Inizializzazione...") è disaccoppiata dall'array inviato al server, e lo storico termina sempre coerentemente con l'ultimo turno dell'utente.
- **MCP Lifecycle & Timeout Handling (`CRIT-02 & HIGH-01`)**: Rimosso in `server/api/llm/generate.post.ts` il blocco `mcpServers = []` che impediva l'uso dei tool MCP per `improve` e `antiban`. Aggiunto il listener `resNode.on('close')` e interruzione istantanea del ciclo LLM con chiusura esplicita (`client.close()`) per evitare memory leak sui processi figli in Nitro.
- **Cockpit Token & Multi-Tier Fallback (`CRIT-03`)**: Risolto in `server/api/llm/generate.post.ts` e `server/api/settings/cockpit.get.ts` il parsing dei token Cockpit (`access_token`, `oauth_token`, `api_key`) e aggiunto il fallback su `accounts.json` qualora l'ID account non sia specificato o il token si trovi nella root del file di sessione.
- **Dual Spintax Engine (`CRIT-04`)**: Unificata e potenziata la sintassi Spintax in `lib/spintax.ts` e `composables/useWhatsAppFormat.ts` per supportare nativamente sia `{a|b|c}` sia `[a|b|c]`, allineando il system prompt AI per generare variazioni anti-ban coerenti.

## [2.8.4] - 2026-07-10

### Fixed
- **Token Cockpit a Runtime**: Risolto l'errore durante la generazione e formattazione dei messaggi con assistente AI caricando a runtime il token aggiornato da `~/.antigravity_cockpit/accounts/<id>.json` quando Cockpit è abilitato.
- **Supporto API Key Dirette**: Garantita la compatibilità con le API Key impostate manualmente nella UI (OpenAI, Gemini, Anthropic, Custom Base URL) come fallback qualora Cockpit fosse disattivato.
- **TS Build in llm.put.ts**: Aggiunto cast `as any` al payload di Zod per aggirare l'incompatibilità tra Zod e il tipo JSON Prisma, stabilizzando le build Docker in produzione.

## [2.8.3] - 2026-07-10

### Fixed
- **Nuxt 3 Hydration Race Condition**: Risolto il bounce casuale verso la Home Page (`/`) sostituendo `ref(null)` con `useState('auth-user', () => null)` nello store auth.
- **Eliminazione Template**: Ora l'eliminazione di un template usato da campagne attive restituisce un errore HTTP 400 controllato con l'elenco delle campagne, invece di un errore 500 generico.

### Added
- **Regole Memoria Agente**: Aggiunta la policy in `AGENTS.md` per l'auto-aggiornamento di `MEMORY.md` al termine dello sviluppo.

## [2.1.2] - 2026-06-26

### Fixed
- **QR Code GoWA**: `getQRCode()` in `whatsapp-engine.ts` chiamava `/app/login` di go-whatsapp-web-multidevice con `GET` invece di `POST` → il QR non veniva mai generato. Corretto il metodo HTTP in base all'engine attivo.
- **QR Code GoWA — parsing risposta**: Aggiunto fallback su `data.data?.qr_link` e `data.qr_link` per coprire varianti di risposta dell'API GoWA; aggiunto check `imgRes.ok` prima di leggere il buffer PNG; aggiunto replace di `127.0.0.1:3000` → `gowa:3000`.
- **Pagina Stato API crash**: `waStore.engine` e `waStore.phone` non erano esposti dallo store Pinia → crash runtime silenzioso che impediva il rendering della pagina. Aggiunti come computed properties.
- **Stato API — `fetchStatus()` mancante**: La pagina `api-status.vue` chiamava `waStore.fetchStatus()` che non esisteva. Aggiunto come alias di `fetchSessions()`.
- **`ENGINE` doppio export**: Rimosso il re-export ridondante di `ENGINE` in fondo al file; ora è `export const` direttamente alla dichiarazione.

## [0.1.0] - 2026-06-24

### Added
- **Architettura Core**: Configurazione iniziale del progetto in Next.js 15 (App Router) e React 19, in esecuzione su **Bun**.
- **Design System e UI**: Creazione del design system `Pro Connect` tramite Google Stitch, in stile Apple/Google con Dark Mode nativa e glassmorphism.
- **Skeleton Loaders**: Integrazione di `phantom-ui` per gestire elegantemente il caricamento asincrono.
- **Backend WhatsApp**: Strato di astrazione `whatsapp-engine.ts` per supportare `WuzAPI` e `go-whatsapp-web-multidevice`.
- **Database ORM**: Modelli Prisma con backend SQLite per Contatti, Campagne, Template e Messaggi.
- **Sicurezza (Secure by Design)**:
  - Protezione XSS e validazione rigorosa degli input tramite **Zod** (OWASP A03).
  - Rate Limiting e controllo degli abusi (OWASP A04).
  - Middleware di sicurezza Next.js con CSP, HSTS, X-Frame-Options (OWASP A05).
  - Logger di sicurezza strutturato basato su NIST CSF 2.0 (OWASP A09).
- **Knowledge Base**: Sistema di memoria e contestualizzazione avanzata con `wiki-brain`, `MEMORY.md`, e predisposizione per `Graphify`.


---

## [Unreleased]

## [0.1.0] - 2026-06-24

### Added
- Initial project scaffold with Next.js 14 (App Router + TypeScript)
- Docker Compose orchestration: Next.js + WuzAPI + SQLite volume
- Prisma ORM schema: contacts, campaigns, messages, templates
- Contact management: CRUD, CSV/Excel import, validation
- Message templates with dynamic variables (`{{Name}}`, `{{email}}`, etc.)
- Campaign Wizard: step-by-step bulk send with configurable rate limiting
- Real-time QR Code scan modal for WhatsApp connection
- Dashboard analytics: sent/failed stats, campaign history
- Migration script from legacy `waforge v5` CSV format
- GitHub Actions CI/CD pipeline
- `.env.example` with all required environment variables

### Architecture
- Migrated from Selenium + Python monolith → WuzAPI (Go/whatsmeow) REST API
- No browser dependency: native WhatsApp Web protocol via whatsmeow
- Persistent session storage via Docker volumes

[0.1.0]: https://github.com/darkrei08/waforge/releases/tag/v0.1.0
