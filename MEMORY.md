# Current Project State (Session Saved: ✅)

## Cosa è stato completato
- **Fase 1 (MVP CRM + Auth multi-tenant)**: Completata. Ristrutturazione repository (monorepo con `services/`), integrazione Prisma multi-tenant (`activeFeatures` su Team), IaC Docker/Traefik ed Elysia Auth skeleton.
- **Fase 2 (Modulo CRM)**: Completata l'infrastruttura core e UI per il CRM Pipeline. 
  - Aggiunti modelli `PipelineStage` e `ContactNote` al database Prisma (con `pipelineStageId` nei contatti) + rigenerato il client Prisma.
  - Sviluppate le API CRM complete su Elysia (`/core/crm/pipeline-stages`, `/core/crm/contacts/:id/stage`, `/core/crm/contacts/:id/notes`, `/core/crm/analytics`).
  - Creato lo store Pinia per il CRM (`stores/crm.ts`) con tipizzazioni TypeScript.
  - Sviluppata la pagina Kanban in Nuxt (`pages/crm/index.vue`) e il componente Drag&Drop nativo `CrmKanban.vue`.
  - Aggiunto il collegamento alla nuova Pipeline nella Sidebar.

## Bug irrisolti o open questions
- Le pagine di dettaglio singolo contatto (`/crm/[id]`) e Analytics (`/crm/analytics`) al momento sono stub o da sviluppare nel dettaglio (attualmente implementata la board principale).
- Le vecchie API per i webhook WA (`/gowa`, `/wuzapi`) risiedono ancora temporaneamente nel `core-api`, in attesa della migrazione in Fase 3 per preservare il funzionamento dell'attuale engine.

## Prossimi step (TODO)
- **Fase 3: Estrazione e Isolamento WA Forge (Plugin Campagne)**:
  - Creare il nuovo microservizio `services/wa-forge` per spostare la logica specifica di messaggistica (BullMQ worker, integrazioni GoWA/WuzAPI).
  - Implementare i "Feature Guard" per limitare l'accesso alla sezione campagne/templates solo ai tenant con la feature `wa.forge.campaigns` abilitata.

## Decisioni architetturali prese
- Microservizi Elysia (Bun) usati per il layer di business logic dietro a un reverse proxy Traefik (`/core` route), isolando Nuxt al ruolo di puro frontend BFF.
- Database Multi-tenant: Isolamento logico tramite `teamId` per garantire massima sicurezza tra i vari tenant in fase B2B SaaS.
- Drag & Drop: Sfruttate le API native HTML5 per il componente Kanban Vue al fine di evitare dipendenze superflue di terze parti e pesare sul bundle JS. 
- Timeline Eventi: Ogni cambio di colonna (stage) Kanban di un contatto innesca la creazione automatica di un record `ContactNote` di tipo `stage_change`.
