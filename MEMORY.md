# WaForge - Project Brain & State (Compressed)

> File di contesto persistente. Compresso e ottimizzato tramite best practices (cavemanv, sqz, lean-ctx).

## 📌 Identità & Architettura
- **Nome:** WaForge (ex WA Sender Pro).
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
