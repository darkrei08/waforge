---
date: 2026-07-13
sources:
  - session-v2.15.1
tags: [architecture, nitro, nuxt, prisma, postgresql, whatsapp, multi-engine, openwa, llm, prompt-registry, frontier]
---
# Architettura WaForge (v2.15.1 - Frontier LLM & Multi-Engine Edition)

Il progetto è basato sullo stack **Nuxt 4 / Vue 3** con server engine **Nitro (H3)** e database **PostgreSQL** tramite ORM **Prisma v5.22.0**.
Questa architettura permette un'esecuzione ottimizzata in ambiente Docker multi-container, adatta sia per ambienti Node.js classici sia per runtime ad alte prestazioni come **Bun**.

## Componenti Principali
1. **Frontend**: Vue 3 (Composition API) con gestione di stato tramite **Pinia**. Tailwind CSS e `@nuxtjs/color-mode` gestiscono un'UI premium con Glassmorphism.
2. **Backend**: Endpoints REST ed SSE situati sotto `server/api/`, scritti sfruttando l'engine H3 con validazione rigorosa in ingresso tramite **Zod** (`OWASP A03`).
3. **Persistenza e Database**: PostgreSQL abbinato a Prisma ORM v5.22.0 con client singleton globale in RAM per prevenire memory leak a runtime.
4. **Job Queue & Redis**: Situata in `server/utils/job-queue.ts`, implementa il batching e l'invio asincrono con **BullMQ** su Redis e algoritmo **Spintax / Jitter** per mitigare i ban WhatsApp.
5. **WhatsApp Core Multi-Engine Router (`lib/whatsapp-engine.ts`)**:
   - Astrazione unificata che supporta tre framework di erogazione e interconnessione:
     - **WuzAPI** (`asternic/wuzapi`) sulla porta 3100
     - **GoWA** (`aldinokemal/go-whatsapp-web-multidevice`) sulla porta 3000
     - **OpenWA** (`rmyndharis/OpenWA` / Baileys Node.js) sulla porta 2785
   - In modalità `WHATSAPP_ENGINE=hybrid`, il controller esegue il **Load Balancing Round-Robin** tra le sessioni attive dei 3 motori per distribuire il traffico e applica il **Failover Automatico** su errore o disconnessione di una delle istanze.
   - Tutti i container comunicano privatamente nella rete `wa-net` e le porte sono dichiarate tramite `expose` in `docker-compose.yml` per impedire port leakage verso l'host esterno.

6. **Motore di Catalogo LLM Dinamico & Prompt Orchestrator (`lib/llm-models.ts`, `lib/prompt-registry.ts`)**:
   - **Merge Garantito dei Modelli di Frontiera (`mergeModelsWithFallback`)**: Risolve l'asincronia tra le release sulle interfacce web dei provider (*ChatGPT, Claude.ai, AI Studio*) e le API grezze (es. OpenRouter). Il catalogo include nativamente tutti i modelli 2025/2026:
     - 🧠 **Thinking / Reasoning**: `gemini-3.5-pro`, `gemini-2.5-pro`, `claude-3-7-sonnet-latest`, `claude-opus-4`, `o3-mini`, `o1`, `gpt-4.5-preview`, `deepseek-reasoner`.
     - 💻 **Code Specialists**: `claude-3-5-sonnet-latest`, `claude-sonnet-4`, `gpt-4.1`, `codestral-latest`, `command-a`.
     - ⚡ **Fast / Instant**: `gemini-3.5-flash`, `gemini-2.5-flash`, `claude-3-5-haiku-latest`, `gpt-4o-mini`, `deepseek-chat`.
   - **Prompt Registry (`lib/prompt-registry.ts`)**: Centralizza le istruzioni di sistema con supporto nativo per l'alta varianza sintattica (Anti-Ban Spintax `{opzione 1 | opzione 2}`) e la scomposizione strategica tramite **Chain-of-Thought** nel blocco `<ragionamento>...</ragionamento>`.
   - **Sovrascrittura Dinamica in Chat (`modelOverride` & `reasoningMode`)**: Consente agli utenti di passare istantaneamente dall'impostazione predefinita del workspace a qualsiasi modello del catalogo frontier direttamente dalla barra di conversazione, applicando in tempo reale le regole Anti-Ban e i preset professionali.
