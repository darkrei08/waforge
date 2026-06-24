---
date: 2026-06-24
sources:
  - session-v1.0.0
tags: [architecture, nitro, nuxt, prisma]
---
# Architettura WA Sender Pro

Il progetto è basato sullo stack **Nuxt 3** con server engine **Nitro (H3)**. 
Questa architettura permette un'esecuzione ottimizzata, adatta sia per ambienti Node classici sia per runtime moderni come **Bun**.

## Componenti Principali
1. **Frontend**: Vue 3 (Composition API) con gestione di stato tramite **Pinia**. Tailwind CSS gestisce l'UI.
2. **Backend**: Endpoints situati sotto `server/api/`, scritti sfruttando l'engine H3.
3. **Persistenza**: Prisma ORM abbinato a SQLite. È stato implementato un `server/utils/prisma.ts` singleton globale in RAM per prevenire i memory leak a runtime.
4. **Job Queue**: Situata in `server/utils/job-queue.ts`, implementa il batching e l'invio asincrono con l'algoritmo **Spintax** e **Jitter** per mitigare i soft-ban di WhatsApp.
