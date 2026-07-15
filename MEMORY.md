# Current Project State (Session Saved: ✅)

## Cosa è stato completato
- **Fase 1 (MVP CRM + Auth multi-tenant)**: Ristrutturazione repository (`services/core-api`), Prisma schema con billing (JSON fields `activeFeatures`, `limits`), e IaC in Docker/Traefik.
- **Fase 2 (Modulo CRM)**: Modelli `PipelineStage` e `ContactNote` aggiunti. API CRM sviluppate in ElysiaJS. Dashboard Kanban in Nuxt3 con HTML5 Drag&Drop.
- **Git Flow (Branching & Versioning)**: Creato un nuovo branch dedicato `feature/crm-multi-tenant` isolato dal `main` per mantenere stabile il sistema attuale in produzione. Il branch include le Fasi 1 e 2 ed è stato caricato (push) su GitHub con successo.

## Bug irrisolti o open questions
- Le vecchie API per i webhook WA (`/gowa`, `/wuzapi`) risiedono ancora in `core-api`. Devono essere migrate in un microservizio separato in Fase 3 per preservare il funzionamento dell'attuale engine senza inquinare il core.
- Dettaglio contatti e Analytics UI sono ancora stub (rimandati al termine dell'isolamento infrastrutturale).

## Prossimi step (TODO)
- **Fase 3: Estrazione e Isolamento WA Forge (Plugin Campagne)**:
  - Isolare le funzionalità WhatsApp in un nuovo microservizio indipendente `services/wa-forge`.
  - Introdurre i "Feature Guard" per limitare l'accesso alla sezione campagne solo ai tenant con la licenza adatta abilitata nel DB.

## Decisioni architetturali prese
- Modello a Microservizi Elysia (Bun) + BFF Nuxt, esposti tramite Traefik Ingress.
- Architettura SaaS protetta in `feature/crm-multi-tenant` così da permettere uno sviluppo iterativo sul nuovo modello di multi-tenancy e billing senza compromettere la stabilità del monolite base originale.
- State persistence eseguita regolarmente secondo le procedure della skill session-manager.

## [Session State Snapshot] - 2026-07-15 20:04:46
MEMORY.md

