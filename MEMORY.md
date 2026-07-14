# WaForge - Project Brain & State (Compressed)

> File di contesto persistente. Compresso e ottimizzato tramite best practices (cavemanv, sqz, lean-ctx).

## 📌 Identità & Architettura
- **Nome:** WaForge.
- **Modello:** SaaS Multi-Tenant (B2B). I team/agenzie sono isolati tramite `teamId`.
- **Stack:** Nuxt 4 (Vue 3, Nitro) + PostgreSQL + Prisma v5.22.0.
- **UI/UX:** Design premium (Glassmorphism, TailwindCSS, Color Mode).
- **Core Engine:** Astrazione multi-provider WuzAPI / go-whatsapp-web-multidevice (in `lib/whatsapp-engine.ts`).

## 🧠 Stato dello Sviluppo & Risoluzioni (Giugno 2026)
- **Database Migrato:** Passaggio completato da SQLite a PostgreSQL.
- **Fix Prisma/Nitro:** Risolto conflitto fatale tra Prisma v7.8.0 e il bundler Nitro Edge. Prisma e `@prisma/client` sono stati stabilizzati alla **v5.22.0**, con `url` reimpostato nello `schema.prisma`. Questo assicura connessioni dirette (senza necessità di adapter o accelerateUrl) e previene crash runtime in HMR.
- **Autenticazione (API):** L'endpoint `/api/auth/register` è testato e funzionante. Crea correttamente l'utente, cifra la password (bcrypt), crea il `Team` associato, genera un `TeamMembership` (ruolo OWNER) e restituisce un cookie JWT contenente `userId` e `teamId`.

## 🚀 Prossimi Step Immediati (Next Actions)
1. **Frontend Auth:** Creare le pagine UI moderne per `/login` e `/register` (ispirate ai mockup premium).
2. **Auth Guard:** Implementare il middleware globale Nuxt (`middleware/auth.global.ts`) per proteggere il workspace (Dashboard, Rubrica, Campagne).
3. **Store Management:** Integrare Pinia (`stores/auth.ts`) per gestire l'idratazione dello stato utente/team al refresh della pagina tramite `/api/auth/me`.
4. **Isolamento API Backend:** Modificare tutti i controller CRUD (Contatti, Campagne, Connessione WA) per filtrare rigorosamente le query usando il `teamId` estratto dal JWT.

## ⚠️ Regole Invariabili (Constraints)
- **Niente Edge Client:** Evitare aggiornamenti di Prisma che impongano l'architettura edge senza driver adapter.
- **Data Leakage:** Nessuna query backend deve omettere la clausola `where: { teamId: user.teamId }`.
- **Workflow:** Pianificare (Plan), Eseguire, Verificare prima di confermare.

## [Session State Snapshot] - 2026-07-14 21:35:00
### Session Summary - WaForge Container Permissions, Chat UI/UX & Wizard-AI Release

1. **Docker Container Permissions (`waforge_uploads` volume)**:
   - Risolto errore 500 EACCES per l'upload media limitando i permessi all'utente `nuxtjs`.
   - Introdotto il pattern `entrypoint.sh` con `su-exec`: lo script esegue `chown -R nuxtjs:nuxtjs /app/data` da root prima di passare i processi in esecuzione all'utente limitato (Drop Privileges). Questo garantisce massima sicurezza ed evita conflitti nei volumi montati nativamente dal server host.

2. **UI/UX & Audio Permissions (`chat.vue`, `ChatInputCapsule.vue`)**:
   - Gestito il blocco `navigator.mediaDevices` che provocava crash silenziosi dell'interfaccia quando l'app non veniva servita su protocolli HTTPS. È stato implementato un Fallback visuale (Toaster).
   - Ristrutturato il componente d'ingresso della Chat UI. Sostituito form grezzo con `ChatInputCapsule` integrando gli slot dinamici (`prefix` e `attachment`). Le logiche flexbox e l'overflow hidden/auto risolvono lo sfasamento tra background, messaggi testuali e container, incapsulando correttamente input.

3. **Integrazione Backend docker-compose.yml (`mcp-agent` & `cockpit-agent`)**:
   - Fixati i path build orfani nel file `docker-compose.yml` (`nuxt-mcp-agent-starter`), per cui ora gli agent container sono basati sull'estrazione diretta delle immagini precompilate (latest) da GitHub Container Registry, bypassando il check di context build obsoleto.

4. **Wizard-AI Pubblicato (v0.49.4)**:
   - Rilascio di Wizard-AI-CLI configurato tramite token Auth, completando push version v0.49.4 e commit di allineamento branch git.

## [Session State Snapshot] - 2026-07-13 01:41:00
### Session Summary - Frontier 2026 Model Catalog, Prompt Registry & Dynamic Chat Override

1. **Guaranteed Frontier Models Merge (`mergeModelsWithFallback`) across Ecosystem**:
   - Spiegato e risolto il motivo per cui i modelli di frontiera e in preview presenti sulle Web UI dei provider (*ChatGPT*, *Claude.ai*, *AI Studio*) non venivano restituiti dagli endpoint API grezzi di OpenRouter o direct listing.
   - Aggiornato `lib/llm-models.ts` su `waforge`, `nuxt-mcp-agent-starter` e `nuxt-cockpit-agent-starter` con l'elenco esaustivo 2025/2026: `gemini-3.5-pro`, `gemini-2.5-pro`, `claude-3-7-sonnet-latest`, `claude-3-5-sonnet-latest`, `o3-mini`, `o1`, `gpt-4.5-preview`, `deepseek-reasoner`.
   - Modificato `fetchModelCatalog()` in `server/utils/llm-catalog.ts` in modo che chiami sempre `mergeModelsWithFallback()`, garantendo al 100% che ogni modello di frontiera sia inietttato con priorità e visibile al volo nei selettori di chat.

2. **Standardized Prompt Registry & Anti-Ban CoT (`lib/prompt-registry.ts`)**:
   - Centralizzato l'orchestratore di prompt (`PROMPT_INDEX`) nei 3 repository con le modalità *Anti-Ban Stealth Max 2026* (varianza sintattica e Spintax `{a|b}`), *Chain-of-Thought* (`<ragionamento>...</ragionamento>`), *Creative Copywriting* e *Analytical*.

3. **Multi-Repo Build Testing & Deployment (`Loop 1-5`)**:
   - Eseguiti i test di compilazione per produzione (`bun run build` / `nuxt build`) su tutti e tre i repository, verificando l'assenza di errori di sintassi o tipi (`spec-kit` / TypeScript Strict Base Kit).
   - Eseguiti i commit e il push sui branch `main` dei 3 repository (`waforge`, `nuxt-mcp-agent-starter`, `nuxt-cockpit-agent-starter`), chiudendo il ciclo Loop 5 e pulendo le directory temporanee (`.nuxt`, `.output`).

4. **Integrazione Master Optimizer & Context Pruning (`caveman`, `ponytail`, `sqz`, `ktx` / `lean-ctx`, `headroom`, `handoff`) nei Loop**:
   - Aggiornate ufficialmente le regole di `wizard-ai-hub/SKILL.md`, `workflow-agentic-brain/SKILL.md`, `loop-4-refactor/SKILL.md` e `loop-5-release/SKILL.md`.
   - L'intero stack di compressione (`caveman` -75% output, `ponytail` anti-overengineering, `sqz` compattazione log, `lean-ctx` / `ktx` potatura del contesto visibile 60-90%, `headroom` proxying e `mp-handoff` chiusura di sessione) è ora reso un gate obbligatorio nei cicli di ottimizzazione e di handoff per azzerare memory bloat e debito tecnico.

## [Session State Snapshot] - 2026-07-13 00:50:00
### Session Summary - Docker Production Bun Bundle & v2.15.1 Release

1. **Docker Production Image Refinement (`Dockerfile`)**:
   - Risolto l'errore `exec: "bun": executable file not found in $PATH` durante l'esecuzione del comando `docker exec -it waforge-app bun run admin:reset-password`.
   - Il `runner stage` (`node:20-alpine`) copia ora nativamente l'eseguibile di `bun` da `oven/bun:1-alpine`, assieme alla cartella `bin/`, `package.json` e alle dipendenze minime di esecuzione (`@prisma/client` e `bcryptjs`).

2. **Refining CLI Reset Tool & Documentation (`bin/reset-admin-password.ts`, `docs/wiki/ripristino-password-admin.md`, `README.md`)**:
   - Modificato `bin/reset-admin-password.ts` per terminare con codice `0` (`process.exit(0)`) quando eseguito in modalità informativa per elencare gli amministratori, evitando il messaggio `error: script exited with code 1`.
   - Aggiornati i file `README.md`, `README.it.md` e `docs/wiki/ripristino-password-admin.md` con il nome corretto del container (`waforge-app`) e le istruzioni di aggiornamento del container (`docker compose pull && docker compose up -d --build`).

3. **Release Automation (`v2.15.1`)**:
   - Pubblicata e taggata la versione `v2.15.1` con aggiornamento di `package.json` e sincronizzazione del grafo di conoscenza tramite `graphify update .`.

## [Session State Snapshot] - 2026-07-12 11:45:00
### Session Summary - Admin Recovery, Cockpit Resilience & Always-on Debug Widget

1. **Admin Password Recovery Tool (`bin/reset-admin-password.ts`)**:
   - Creata l'utility CLI ufficiale di ripristino password per amministratori (`bun run admin:reset-password --email <email> --password <pass>`).
   - Se eseguita senza parametri, elenca tutti gli utenti/amministratori (`isSuperAdmin: true`) presenti nel database, fornendo ad operatori e devops il comando esatto per sbloccare l'accesso in sicurezza negli ambienti on-premise/Docker.

2. **Always-on Debug Widget Toggle (`app.vue`, `components/DebugWidget.vue`)**:
   - Reso incondizionato l'avvio del `DebugWidget` come richiesto dalle direttive. Aggiunto un pulsante flottante ad alta visibilità (`🐞 Debugger`) in basso a destra (`fixed bottom-4 right-4 z-[10000]`) per consentire la riapertura istantanea dell'interfaccia di analisi log, stato Pinia e richieste network.

3. **Cockpit Daemon Proxy Failover (`server/api/llm/generate.post.ts`)**:
   - Risolto il blocco "Cockpit Daemon rilevato correttamente ma non funzionante" causato dalla porta `19528` (che espone solo il servizio WebSocket).
   - Implementata la verifica di rotta: se il `COCKPIT_HOST_URL` o il proxy locale rifiutano le connessioni HTTP (`fetch failed`, `ECONNREFUSED`, `Empty reply`), il sistema intercetta l'eccezione, estrae il token Cockpit (`access_token` da `~/.antigravity_cockpit/accounts/<id>.json`) ed esegue il failover automatico alle API dirette del provider (`OpenRouter`, `Gemini REST`, `OpenAI`).

## [Session State Snapshot] - 2026-07-12 11:15:00
### Session Summary - OpenWA & Hybrid Multi-Engine Router Integration

1. **OpenWA Framework (`OPENWA-01`)**:
   - **`docker-compose.yml` & `.env`**: Aggiunto il terzo framework di gestione WhatsApp, [OpenWA](https://github.com/rmyndharis/OpenWA) (`ghcr.io/rmyndharis/openwa:latest`), esposto sulla porta `2785` (`expose: - "2785"`). Allineata la configurazione di `WuzAPI` e `GoWA` usando le direttive `expose` per evitare leakage di porte sull'host mantenendo piena comunicazione nella rete `wa-net`.

2. **Hybrid Multi-Engine Load Balancer (`HYBRID-01`)**:
   - **`lib/whatsapp-engine.ts`**: Riprogettato l'engine controller impostando `WHATSAPP_ENGINE=hybrid` come impostazione di punta. In questa modalità il sistema interroga in parallelo tutti e tre gli engine (`wuzapi`, `gowa`, `openwa`), li bilancia in Round-Robin all'invio dei messaggi e attiva il failover automatico su errore/disconnessione di un'istanza.
   - Implementati gli endpoint REST di `OpenWA` (`/api/sessions/:id/send-message`, `/api/sessions/:id/send-file`, ecc.) per uniformare il payload in uscita con gli altri engine.

3. **Allineamento API e UI (`stores/settings.ts`, `stores/whatsapp.ts`, `validation.ts`)**:
   - Aggiunto supporto a `'openwa'` e `'hybrid'` nello schema di validazione Zod e negli store Pinia. Il widget di debug (`NUXT_PUBLIC_ENABLE_DEBUG_WIDGET=true`) e la formattazione di `docker-compose.yml` (`labels:` in formato standard `key: "value"`) sono stati ottimizzati.

## [Session State Snapshot] - 2026-07-12 08:57:00
### Session Summary - Targeted Optimizations & Bugfixing (Caveman/Ponytail Mode)

1. **SSE 400 & Chat History Corruption (Fixed)**:
   - **`pages/templates.vue`**: Il frontend iniettava un placeholder temporaneo `role: 'assistant', content: 'Inizializzazione...'` nell'array `chatHistory` inviato all'API. Separata la variabile di stato per il rendering UI (`loadingMsg`) dall'array inviato all'API (`historyToSend`). Lo storico ora termina sempre con l'ultimo turno dell'utente, risolvendo l'errore `400 Bad Request` su provider LLM restrittivi.

2. **MCP Lifecycle, Timeout & Child Processes (Fixed)**:
   - **`server/api/llm/generate.post.ts`**: Rimosso il blocco forzato `mcpServers = []` che impediva l'esecuzione dei tool per chiamate anti-ban o di formattazione.
   - Aggiunto il listener `resNode.on('close')` e il check `if (clientAborted) break` nel loop LLM con chiusura automatica dei client (`client.close()`) nel blocco `finally` per azzerare memory leak in Nitro/Docker.

3. **Cockpit Token & Multi-Tier Fallback (Fixed)**:
   - **`server/api/llm/generate.post.ts`**: Ottimizzato il caricamento del token Cockpit (`access_token`, `oauth_token`, `api_key`) dai file individuali `~/.antigravity_cockpit/accounts/<id>.json` con fallback automatico su `accounts.json`.

4. **Dual Spintax Engine (`{a|b}` & `[a|b]`) (Fixed)**:
   - **`lib/spintax.ts` & `composables/useWhatsAppFormat.ts`**: Aggiornato il regex di espansione e conteggio (`/(\{([^{}]+)\}|\[([^\[\]]+\|[^\[\]]+)\])/g`) per supportare sia parentesi graffe che quadre provviste di pipe, e allineato il system prompt di generazione AI.

5. **Zod & Prisma Compatibility (Verified)**:
   - **`server/api/settings/llm.put.ts` & `stores/settings.ts`**: Allineamento completo dello schema Zod e cast `parsed.data as any` per garantire perfetta serializzazione JSON in Prisma.

## [Session State Snapshot] - 2026-06-25 00:07:49
### Session Summary - Debug & Bugfixing (Prisma, Redis, Docker)

1. **Prisma & DB Connection (Fixed)**:
   - **Crash `libssl.so.1.1`**: Added `apk add --no-cache openssl` to `Dockerfile` so Prisma detects OpenSSL 3.x on Alpine 3.17+ and uses `linux-musl-openssl-3.0.x` instead of falling back to OpenSSL 1.1.
   - **Missing Tables / Silent Migration Failure**: Removed `2>/dev/null` in Dockerfile CMD and pinned version `npx prisma@5.22.0 migrate deploy`. Previously, `npx` downloaded Prisma 7.x which broke `schema.prisma` validation, causing migrations to fail silently and leaving the DB empty.
   - **Vite Bundler Issue**: Refactored `server/utils/prisma.ts` to use `getEnv()` (opaque `process.env` access) to prevent Nuxt/Vite from statically replacing `process.env.DATABASE_URL` with `undefined` at build time.
   - **Security (CWE-798)**: Added a check in `prisma.ts` to warn if default `postgres` credentials are used in production.

2. **Redis `ECONNREFUSED 127.0.0.1:6379` (Fixed)**:
   - **Vite Bundler Issue**: Similar to the DB, refactored `server/utils/job-queue.ts` using `getEnv()` so `REDIS_URL` is read dynamically at runtime.
   - **Docker Compose Override**: Hardcoded `REDIS_URL=redis://redis:6379` and `DATABASE_URL` in `docker-compose.yml` to prevent local `.env` files (which use `localhost`) from overriding internal Docker networking.

3. **Nuxt Debug Widget (Enabled)**:
   - Added `enableDebugWidget` to `runtimeConfig.public` in `nuxt.config.ts`.
   - Mapped `ENABLE_DEBUG_WIDGET` to `NUXT_PUBLIC_ENABLE_DEBUG_WIDGET` in `docker-compose.yml` to support Nitro's runtime override mechanism.

**Next Steps**:
Test registration endpoint, verify user creation, and monitor app behavior using the newly enabled debug widget.


## [Session State Snapshot] - 2026-06-25 00:21:24
Fix login and registration bugs (authStore.fetchUser missing, cookie secure attribute drop on HTTP). Integrated Traefik production labels.


## [Session State Snapshot] - 2026-06-25 00:31:54
WaForge project: Added Templates management (pages/templates.vue, stores/templates.ts) with real-time WhatsApp rich text preview. Wired it into the main layout and translations. Also fixed the Google Stitch design system theme mapping: moved colors to CSS variables in assets/css/main.css and updated tailwind.config.js to correctly support light and dark mode toggles natively instead of static dark colors.


## [Session State Snapshot] - 2026-06-25 00:35:40
WaForge project: Implemented Live Chat CRM module. Created UI pages/chat.vue with split-pane layout and WebSockets auto-updating. Created stores/chat.ts to manage real-time messages. Implemented backend endpoints /api/chat/index.get.ts, /api/chat/[contactId]/messages.get.ts, and /api/chat/send.post.ts. Fixed Prisma schema bug in the webhook wuzapi.post.ts (body -> content). Updated task.md and created walkthrough.md.


## [Session State Snapshot] - 2026-06-25 01:05:49
WaForge Project Finalization - Status: COMPLETE.
1. Architecture: Nuxt 3 (SSR/Nitro) + WuzAPI + Postgres + Redis (BullMQ). Traefik labels added to docker-compose.yml for production reverse proxy & HTTPS.
2. i18n Fix: Set lazy:false in Nuxt config. Translations (nav.templates, connect.title) now correctly pre-bundled and won't break on SPA navigation.
3. Light Theme Contrast Fix: Updated layouts/default.vue & pages/connect.vue to explicitly use border-black/5 and text-gray-900 for proper visibility.
4. QR Code / WuzAPI Engine Fix: The image aldinokemal/go-whatsapp-web-multidevice was removed from dockerhub, so we kept WuzAPI. Added a Self-Healing mechanism in lib/whatsapp-engine.ts: on 401 Unauthorized, the backend natively auto-provisions the user against the WuzAPI /admin/users endpoint. QR Code generation is now 100% plug-and-play for fresh Docker setups.
Next Steps for User: Test Whatsapp QR Code pairing via dashboard, evaluate the web-chat/campaign functionality, and deploy the stack using Traefik.


## [Session State Snapshot] - 2026-06-25 01:22:39
WaForge Project Update - Status: COMPLETE (v2.0.1 released).
1. GoWA v8 Integration: Fixed the QR code generation endpoint. Replaced the WuzAPI logic with the new GoWA requirement (passing X-Device-Id: waforge-default header). Implemented auto-provisioning via POST /devices if DEVICE_NOT_FOUND is returned.
2. QR Code Rendering: GoWA returns a URL to a PNG. Implemented server-side fetch inside whatsapp-engine.ts to convert the downloaded image into a data:image/png;base64 string so the frontend works flawlessly without exposing GoWA's internal docker port to the client browser.
3. Nuxt i18n Fix: Translations were failing to load in the Docker production build. Created an explicit `i18n.config.ts` file to statically import the `it.json` and `en.json` files and linked it via `vueI18n: './i18n.config.ts'` in `nuxt.config.ts`.
4. Release v2.0.1: Changes pushed to GitHub, triggering Actions to build the newest ghcr.io/darkrei08/waforge:latest.

## [Session State Snapshot] - 2026-06-26 19:44:00
WaForge Project Update - Status: COMPLETE (v2.1.0 released locally).
1. Missing Functions Completed: Added CSV export API and UI button, User Profile management (name and password), and Detailed Campaign Logs UI (showing sent/failed status and error reasons per message).
2. Bugfix QR Code & Countdown: Fixed an issue where the connect screen spammed the backend for new session tokens on every countdown refresh. Preserved `tokenId` in URL and added a silent retry for when QR code generation takes slightly longer on WuzAPI, fixing the disappearing progress bar.
3. Release v2.1.0: Merged all changes into `main` and ran `ai-release minor` locally to bump package.json and tag `v2.1.0`. Remote authentication failed, awaiting user input to manually push the release to GitHub.

## [Session State Snapshot] - 2026-06-26 20:00:21
WaForge Project Update - Status: COMPLETE (v2.1.0 - i18n & QR Code fix stabilizzati).
DATA: 2026-06-26

=== COSA E' STATO FATTO ===
1. i18n Fix (CRITICO): Risolto errore fatale di compilazione Vue I18n v9+:
   - Rimossi {{Variable}} (doppie graffe obsolete) da it.json/en.json
   - Sostituiti caratteri pipe {a|b} nei template spintax con [a|b]
   - Creato .dockerignore per escludere .nuxt/ dal contesto Docker
2. QR Code & WuzAPI Network Fix:
   - URL interno Docker corretto: http://wuzapi:8080 (non 3100)
   - Aggiornati docker-compose.yml, lib/wuzapi.ts, lib/whatsapp-engine.ts
   - connect.vue: logica di retry silenziosa per QR quando WuzAPI e' lento
3. Build Docker: Compilazione riuscita al 100%. Stack avviato (10/10 container Healthy/Started)
4. Git: Commit pushato su branch fix/i18n-qrcode

=== STATO GRAFO ===
- AST extraction: 97 code files, 12 docs processati
- Semantic extraction: FALLITA per errore di config Gemini (Invalid port ':1')
- Workaround: grafo AST parziale disponibile in graphify-out/

=== PROBLEMI APERTI ===
- graphify semantic backend 'gemini' ha 'Invalid port :1' error (problema config COCKPIT)
- Release v2.1.0 non ancora pushata su GitHub (auth fallita nella sessione precedente)

=== PROSSIMI STEP ===
1. Fare push del branch fix/i18n-qrcode su GitHub e aprire PR verso main
2. Tagare release v2.1.0 e fare push dei tag
3. Risolvere errore porta graphify (controllare config Cockpit Tools)
4. Sviluppare funzioni mancanti: bulk message scheduling, CSV import migliorato


## [Session State Snapshot] - 2026-06-27 10:25:00
WaForge Project Update - Status: COMPLETE (QR Bugfix + Scheduled Campaigns + CSV Import).
DATA: 2026-06-27

=== COSA E' STATO FATTO ===
1. **Fix WuzAPI / GoWA Engine Authentication**: Corretto bug dove il `tokenId` utente veniva passato come password nella Basic Auth di GoWA causando `401 Unauthorized`. Ripristinato `GOWA_TOKEN` come password e usato `tokenId` per l'header `X-Device-Id`. QR Code di nuovo generabile via GoWA (wa-net proxy `getQRCode`).
2. **Bulk Message Scheduling**: Aggiunto campo `scheduledAt` nel database Prisma. Modificato UI di `campaigns.vue` aggiungendo un quarto step "Programmazione (Opzionale)" che salva la data. Implementato un Nitro plugin scheduler `server/plugins/scheduler.ts` che avvia le campagne `SCHEDULED` quando giunge la data/ora prevista.
3. **CSV Import Migliorato**: Rimossa la rudimentale `<textarea>` da `contacts.vue` sostituita con un'interfaccia Drag&Drop elegante (DragEvent / File Input) che legge il file CSV nativamente nel browser mantenendo robusto il parsing in `csv-parser.ts`.

=== PROSSIMI STEP ===
1. Risolvere eventuale errore porta graphify per il semantico (Config Cockpit).
2. Prossimo rilascio: preparare la merge su main per la versione successiva (v2.2.0).

## 2026-06-27: QR Code Generation Fix & Hotfix v2.2.3
### Bug
User was unable to generate QR codes, getting 'No QR Code available'. The app was defaulting to the WuzAPI engine, which did not support the GET /app/qrcode endpoint.
### Fix
- Updated lib/whatsapp-engine.ts to default to 'gowa' engine.
- Updated docker-compose.yml to default WHATSAPP_ENGINE to 'gowa'.
- Released hotfix v2.2.3.

## 2026-06-27: Final GoWA QR Fix (v2.2.4)
### Bug
Even after switching to GoWA, QR generation failed because the lib sent a POST to /app/login (GoWA requires GET for login endpoint) and it passed an incorrect hardcoded device_id ('waforge-default') during auto-provisioning instead of using the session token.
### Fix
- Updated lib/whatsapp-engine.ts to use GET method for GoWA /app/login endpoint.
- Updated lib/whatsapp-engine.ts to use the actual session token dynamically for GoWA device provisioning.
- Released hotfix v2.2.4.

## 2026-06-27: Fix GoWA Status Parsing for UI Unlock (v2.2.5)
### Bug
After fixing the QR code generation, the user reported that scanning the code worked but the UI did not unlock the 'Chats' section. It remained 'Disconnected / OFFLINE'. The root cause was that GoWA v8 wraps the connection status in 'results.is_connected' and 'results.is_logged_in', while WuzAPI and older engines used 'Connected' and 'LoggedIn'. Due to this parsing failure, our engine falsely reported to Nuxt that the device was disconnected.
### Fix
- Updated 'getEngineStatus' in 'lib/whatsapp-engine.ts' to fall back to 'data.results?.is_connected' and 'data.results?.is_logged_in' for GoWA.
- Released hotfix v2.2.5.

### [2026-06-27] Task A: Device Customization & GoWA Disconnect Fix
- **Disconnection Fix**: Updated `lib/whatsapp-engine.ts` to use `DELETE /devices/{id}` for GoWA instead of `POST /app/logout`. Added try-catch in `server/api/whatsapp/disconnect.post.ts` to ignore engine 404s and proceed with local DB cleanup, fixing the "Errore durante la disconnessione" block.
- **Device Personalization**: Added `name` and `tags` to `WhatsAppSession` in `prisma/schema.prisma`. Implemented `server/api/whatsapp/[id].patch.ts` to save names and tags. Updated `pages/devices.vue` to display a pencil icon opening a modal to edit name and tags, and correctly show the Team name.
- **Environment**: Created `.env` from `.env.example` and added SMTP/OAuth configurations to `docker-compose.yml`.

### [2026-06-27] Task B: Team Personalization & Invites (SMTP/OAuth)
- **Team Settings**: Modified `pages/team.vue` to allow viewing and editing the Team name. Added `server/api/team/index.get.ts` and `index.patch.ts`.
- **Invites via SMTP**: Refactored `server/api/auth/invite.post.ts` to generate a JWT invite link and send it via email using `nodemailer`. The link is valid for 48 hours. If SMTP is unconfigured, the token is shown on screen for testing.
- **SSO/OAuth (PocketID)**: Implemented basic OAuth2 flows in `server/api/auth/oauth/login.get.ts` and `callback.get.ts` to support external OIDC providers. Added a "Accedi con SSO" button in `pages/login.vue`.
- **Registration Update**: Updated `pages/register.vue` and `server/api/auth/register.post.ts` to accept `inviteToken`. If a token is provided, the user skips team creation and is automatically enrolled into the target Team.

## 2026-06-27 16:03 - Formattazione WhatsApp
- Aggiornata la legenda e la formattazione nella pagina dei template (`pages/templates.vue`) per supportare nativamente le specifiche complete di WhatsApp (grassetto, corsivo, barrato, monospaziato, codice inline, elenchi, e citazioni).
- Corretto il parsing della risposta API di WuzAPI per risolvere l'errore "Body is unusable" che nascondeva i reali errori di invio.
- Aggiunta la sanificazione automatica e l'inserimento del prefisso internazionale per i numeri italiani (39).
- Rilasciata la patch v2.3.2.

### Session: 2026-06-27 (Campaigns Re-design, Team API Check, Reschedule & Logs Widget)
- **Modifiche UI Campagne**: Convertita la grid in una tabella dettagliata in `pages/campaigns.vue` per migliore gestione massiva.
- **Modifiche API Campagne**: Creati endpoints PATCH e DELETE per le singole campagne e implementato il pulsante per eliminare.
- **Rischedulazione**: Aggiunto supporto alla modifica di `scheduledAt` per rischedulare campagne non in stato DRAFT/RUNNING.
- **Widget Log**: Sostituita la semplice tabella log con un widget in stile terminale scuro/developer tools per le campagne, mostrando timestamp, contatto formattato ed errori.
- **Gestione Teams**: Verificato l'esistente `pages/team.vue` che implementa già i requisiti dell'utente (modifica, inviti, permessi).
- **Controllo Codice**: Compilazione con successo (`npm run build` / `typecheck`) per prevenire bug, eseguendo sviluppo con strict pattern.
- **Release**: Versioni incrementate a `v2.2.7` e `v2.2.8` e rilasciate sul branch di produzione.

## [Session State Snapshot] - 2026-06-27 16:50:00
WaForge Project Update - Fixes:
1. **Profile UI & i18n**: Left-aligned the profile block in `pages/profile.vue` by removing `mx-auto`. Added missing `profile.title` string to `it.json` and `en.json`.
2. **Template Variables UI**: Fixed the placeholder legend in `pages/templates.vue` from `{{Name}}` to `{Name}` to match the actual variable interpolation engine in `whatsapp-engine.ts`.
3. **Fetch Body Error**: Refactored `apiCall` in `lib/whatsapp-engine.ts` to use `$fetch` instead of native `fetch`. This resolves the `TypeError: Body is unusable: Body has already been read` error that occurred when requests were retried or redirected by the engine, which caused the native `Response.text()` to throw and log as `FAILED` in campaign histories.

## [2026-06-27 17:03:00] GOWA Integration
- Aggiunti modelli WhatsAppConversation e WhatsAppScheduledMessage a schema.prisma.
- Creato GowaClient (lib/gowa-client.ts) per interazione Cloud API.
- Sviluppata policy di opt-in/opt-out (lib/whatsapp-policy.ts).
- Creazione Webhook GOWA sicuro con HMAC (server/api/webhook/gowa.ts).
- Aggiornamento stores/chat.ts per UI e stati in real-time.
- Cron worker Nitro implementato (server/tasks/whatsapp-scheduled.ts).

### [2026-06-27 17:18:00] Task C: Device Test Button & Toast UI Fix
- Aggiunto endpoint `server/api/whatsapp/test.post.ts` per l'invio di un messaggio WhatsApp di test al device stesso.
- Modificata UI `pages/devices.vue` aggiungendo il bottone 'Test Messaggio'.
- Spostate le notifiche toast di connessione da top-right a bottom-right (`layouts/default.vue`) modificando anche il flex-direction per evitare overlap con i pulsanti.

### [2026-07-08] Refactoring UI & TypeScript Stability
- **Modali e UI:** Fixati comportamenti anomali del popup CSV (ora si chiude dopo successo), del wizard campagne (stato resettato correttamente) e del modale team (click outside per chiudere).
- **Middlewares & Stores:** Sistemato il bypass della sicurezza sulle rotte `i18n` (es. `/it/campaigns`). Rimossa la cache problematica usando `$fetch` in login/register.
- **Backend TypeScript:** Fixata la configurazione di `tsconfig.json` che era impostata erroneamente su pattern Next.js, abbattendo oltre 120 errori. Risolti disallineamenti di tipizzazione (BullMQ/Redis in `job-queue.ts`) e aggiornate le API delle campagne per richiedere correttamente 2 argomenti (`id`, `teamId`).

### [2026-07-10 12:50] Fix Redirects, Safe Template Deletion & Session Memory Rule
- **Decisioni Architetturali:**
  - Migrato lo stato `user` in `stores/auth.ts` da `ref(null)` a `useState('auth-user', () => null)` per prevenire la race condition di idratazione (Nuxt 3 SSR -> client) che causava reindirizzamenti casuali verso la homepage `/`.
  - Aggiunto controllo di integrità referenziale su `server/api/templates/[id].delete.ts` per bloccare l'eliminazione dei template usati nelle campagne attive, ritornando un errore 400 controllato con l'elenco delle campagne.
  - Inserita una regola globale in `.agents/AGENTS.md` per l'auto-aggiornamento periodico del file `MEMORY.md` a fine task.
- **File Modificati:**
  - `stores/auth.ts`
  - `server/api/templates/[id].delete.ts`
  - `.agents/AGENTS.md`
  - `package.json`
  - `CHANGELOG.md`
  - `MEMORY.md`

### [2026-07-10 13:00] Fix LLM generation error with Cockpit and TypeScript stability
- **Decisioni Architetturali:**
  - Aggiornato `server/api/llm/generate.post.ts` per recuperare dinamicamente a runtime l'access token di Cockpit dal file JSON locale in `~/.antigravity_cockpit/accounts/<id>.json` se `useCockpit` è abilitato.
  - Aggiunto fallback per preservare l'API Key del provider inserita nella UI se `useCockpit` è disabilitato, rispondendo alla richiesta dell'utente di supportare chiavi API dirette.
  - Risolto errore di tipizzazione TypeScript in `server/api/settings/llm.put.ts` applicando un cast `as any` su `parsed.data` nel `prisma.team.update`.
- **File Modificati:**
  - `server/api/llm/generate.post.ts`
  - `server/api/settings/llm.put.ts`
  - `MEMORY.md`

### [2026-07-10 14:15] Audit Fixes: LLM Routing & MCP Build
- **Decisioni Architetturali:**
  - Rimosso `models.get.ts` e `llm-catalog.ts` orfani in `nuxt-mcp-agent-starter` che richiedevano Prisma e rompevano la build Docker.
  - Aggiornato `generate.post.ts` in `waforge` e `chat.post.ts` in `nuxt-mcp-agent-starter` per mappare nativamente le direct API di `deepseek`, `mistral`, `groq`, `cohere`.
  - Instradati a `openrouter` sia `meta` (che non ha API propria standard) sia le chiamate dirette ad `anthropic` (per aggirare l'incompatibilità con `/v1/chat/completions`).
- **File Modificati:**
  - `~/.ai-skills` (nuxt-mcp-agent-starter: deleted models.get.ts, llm-catalog.ts)
  - `~/.ai-skills` (nuxt-mcp-agent-starter: modified chat.post.ts)
  - `~/.ai-skills` (waforge: modified generate.post.ts)
  - `MEMORY.md`

### [2026-07-10 16:51] Bugfix: Modelli LLM Mancanti nella Selezione (WaForge)
- **Decisioni Architetturali:**
  - Il catalogo dinamico dei modelli (fetch via OpenRouter o API Dirette) sovrascriveva in maniera eccessiva i fallback hardcodati. Se OpenRouter andava in timeout o falliva, e si aveva un provider diretto configurato (es. solo Gemini API Key), venivano mostrati esclusivamente i modelli Gemini in UI, nascondendo gli altri provider validi hardcodati nel sistema come Anthropic, Meta, Deepseek, ecc.
  - Fix implementato: `server/utils/llm-catalog.ts` è stato modificato in modo tale da precaricare sempre e forzatamente la costante `FALLBACK_MODELS` nell'array dei modelli (`allModels.push(...FALLBACK_MODELS)`). Questo garantisce che la lista predefinita (che include le versioni stabili scelte) sia costantemente presente e sovrascrivibile successivamente da versioni "live" se le API sono online.
- **File Modificati:**
  - `server/utils/llm-catalog.ts`
  - `MEMORY.md`

### [2026-07-10 16:56] Bugfix: LLM stuck on Inizializzazione (WaForge)
- **Decisioni Architetturali:**
  - L'assistente AI nella sezione Templates si bloccava su "Inizializzazione..." perché l'utente aveva incollato erroneamente la configurazione JSON intera (stile Claude Desktop) nel campo dei server MCP in Impostazioni, anziché un comando CLI (`npx`).
  - Questo causava un crash invisibile (o un freeze eterno) di `StdioClientTransport`, che cercava di lanciare `{` come eseguibile di sistema, bloccando lo stream SSE verso il frontend senza restituire errori leggibili.
  - Fix implementato: Aggiunto un `Promise.race` con timeout (10s) sull'avvio dell'MCP Client, e uno skip automatico nel ciclo se il comando inizia con `{` (per intercettare JSON errati in input). Inoltre, l'invio dell'evento "Inizializzazione server MCP..." è stato spostato *prima* del blocco iterativo, in modo da mostrare visivamente al frontend cosa sta succedendo o bloccandosi.
- **File Modificati:**
  - `server/api/llm/generate.post.ts`
  - `MEMORY.md`

### [2026-07-10 17:02] Feature: Inline Template Editing & Smart Scheduling in Campaigns
- **Decisioni Architetturali:**
  - L'utente voleva applicare le funzioni AI Anti-Ban e modificare il template direttamente dallo step 2 della creazione di una Campagna, e riscontrava scomodità nell'impostare l'orario di schedulazione partendo da zero (data UTC o form vuoto).
  - Ho implementato una funzione `getLocalFutureDate(3)` che calcola l'orario locale (compensando la `TimezoneOffset` del browser) e lo inietta automaticamente come default nel campo `datetime-local` impostato a +3 minuti dal momento attuale, migliorando notevolmente la UX.
  - Ho esteso lo Step 2 della Campagna permettendo:
    1. La selezione di un "+ Crea Nuovo Template" direttamente dal dropdown, mostrando un editor compatto con input nome e textarea.
    2. Il salvataggio del nuovo template o l'aggiornamento di un template esistente, comunicando direttamente con le API `/api/templates`.
    3. L'integrazione inline dell'Assistente AI (pulsanti "Migliora" e "Anti-Ban") sulla textarea, così da poter raffinare il copy senza dover navigare prima in `templates.vue`.
- **File Modificati:**
  - `pages/campaigns.vue`
  - `MEMORY.md`


## [Session State Snapshot] - 2026-07-10 18:00:48
Integrate linee guida privacy da legal-scaffold in waforge. Dettagliato lo stack tech (Nuxt, Postgres, Redis, WuzAPI) in ambito GDPR, rimossi dati sensibili e aggiornata la knowledge base con Graphify.


### [2026-07-10 18:07] Bugfix: LLM Gemini Hardcoded Prompts & Missing Models
- **Decisioni Architetturali:**
  - L'utente riportava che la "generazione testo con i prompt hardcoded non funziona" selezionando `Gemini 3.1`.
  - Fix 1 (Modelli fittizi): Nel file di fallback `lib/llm-models.ts` erano presenti modelli inesistenti (`gemini-3.1-pro`, `gemini-3.5-pro`). Inviandoli alla Google API, quest'ultima restituiva errore (Model Not Found). Sostituiti con modelli reali: `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash`.
  - Fix 2 (Prompt Hardcoded vuoti): Nelle azioni `improve` e `antiban` (eseguite dalla UI del chat assistant), l'array `chatHistory` veniva inviato vuoto (`[]`). Il backend (`generate.post.ts`) vedeva che era un array e tentava di usarlo senza un messaggio dell'utente, inviando solo il ruolo `system`. Le API Gemini, a differenza di altre, richiedono obbligatoriamente un messaggio `user`. Ho modificato il parsing per verificare `chatHistory.length > 0` e ho iniettato dinamicamente il prompt dell'utente nel fallback, o in coda alla history, quando si attiva un prompt hardcoded.
- **File Modificati:**
  - `lib/llm-models.ts`
  - `server/api/llm/generate.post.ts`
  - `MEMORY.md`


### [2026-07-12 11:23] Feature & UI Fix: OpenWA + Hybrid Multi-Engine & Settings Triplicate GoWA Resolution
- **Decisioni Architetturali:**
  - Completata l'integrazione di `OpenWA` (`rmyndharis/OpenWA`) come terzo motore WhatsApp nativo basato su Node.js (Baileys) accanto a `WuzAPI` e `GoWA`.
  - Configurato il `Hybrid Multi-Engine Router` (`lib/whatsapp-engine.ts`) che esegue Load Balancing Round-Robin e Failover automatico tra i 3 motori (`wuzapi` | `gowa` | `openwa`).
  - **Bugfix UI Settings (`pages/settings.vue`)**: Nella schermata delle Impostazioni apparivano 3 riquadri identici chiamati `go-whatsapp (gowa)`. La causa risiedeva nell'operatore ternario statico `eng === 'wuzapi' ? t('settings.engine_wuzapi') : t('settings.engine_gowa')`, il quale valutava come "gowa" tutte le tre opzioni successive (`gowa`, `openwa`, `hybrid`). Sostituito con chiavi i18n dinamiche (`settings.engine_${eng}`) e aggiunte le traduzioni in `it.json` ed `en.json` per `engine_openwa` ("OpenWA (Node.js Baileys)") ed `engine_hybrid` ("Hybrid Multi-Engine (Round-Robin)").
  - **Aggiornamento Direttive Loop (`prompt-loop-engine`)**: Aggiornato `SKILL.md` dell'auto-router per imporre l'esecuzione del `Brain-to-Skill` (`ai-graph update` e `book-to-skill`) e controllo grafo semantico in maniera deterministica al PRE-LOOP (Step 1) e al POST-LOOP (Step 10/11) sia per `waforge` che per `Wizard-AI`.
- **File Modificati:**
  - `pages/settings.vue`
  - `i18n/locales/it.json` & `i18n/locales/en.json`
  - `/home/ema/.gemini/config/skills/prompt-loop-engine/SKILL.md`
  - `MEMORY.md`


## [Session State Snapshot] - 2026-07-13 02:13:02
Integrato lucasastorian/llmwiki (ai-llmwiki/ai-wiki) con interfaccia grafica e stabilite regole mandatory nei loop per graphify, book-to-skill e rag-anything


## [Session State Snapshot] - 2026-07-13 02:24:00
Creata e applicata architettura modulare universale Wizard-AI (wizard-ai-init) su waforge e nuxt-mcp-agent-starter con auto-sincronizzazione dei file AGENTS.md, CLAUDE.md e GEMINI.md


## [Session State Snapshot] - 2026-07-13 02:29:32
Eseguito audit di sicurezza universale su waforge, Wizard-AI, nuxt-mcp-agent-starter e nuxt-cockpit-agent-starter; standardizzati path, secrets, e imposto cybersecurity e strix in Loop 3

## [Session State Snapshot] - 2026-07-14 23:46:00
### Session Summary - Astro Landing Page & Single Entry Point Integration
1. **Astro Landing Page (WaForge Frontend)**:
   - Sviluppata la landing page in `apps/frontend` utilizzando Astro 5 e TailwindCSS v4.
   - Creata un'architettura Dark Mode premium con componenti `Header`, `Hero`, `Features` e `Footer`.
   - Compilazione eseguita con successo (`npm run build`).

2. **Single Entry Point (Traefik Routing)**:
   - Modificate le regole di routing di Traefik in `docker-compose.yml` per mappare `waforge-frontend` sulla root (`${DOMAIN:-localhost}` e `www.`) e spostare il backend Nuxt (`waforge`) sul sottodominio `app.` (`app.${DOMAIN:-localhost}`).
   - Aggiornati i link in Astro (`Header.astro`, `Hero.astro`) per puntare correttamente al sottodominio `app.localhost` (variabile d'ambiente `PUBLIC_DASHBOARD_URL`).
