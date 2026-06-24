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

