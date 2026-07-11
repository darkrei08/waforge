# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- Migration script from legacy `wa sender v5` CSV format
- GitHub Actions CI/CD pipeline
- `.env.example` with all required environment variables

### Architecture
- Migrated from Selenium + Python monolith → WuzAPI (Go/whatsmeow) REST API
- No browser dependency: native WhatsApp Web protocol via whatsmeow
- Persistent session storage via Docker volumes

[0.1.0]: https://github.com/darkrei08/waforge/releases/tag/v0.1.0
