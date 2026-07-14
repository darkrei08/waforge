---
name: auto-init-router
description: "Intercepta le richieste iniziali dell'utente (scopo del progetto) e inizializza automaticamente il framework e le tecnologie corrette basate sulle best-practice di Wizard-AI."
---

# Auto-Init Router (Semantic Scaffolder)

Questa skill si attiva all'inizio del **Loop 1 (Plan)** quando l'utente richiede di creare un nuovo progetto, feature, o applicazione.
Funziona da router semantico: invece di chiedere all'utente quale stack usare, **inferisce la tecnologia migliore** basandosi sugli scopi del progetto indicati e inizializza l'ambiente automaticamente.

## Regole di Inferenza Stack (Wizard-AI Tech Stack)

Quando l'utente richiede un progetto, usa la seguente matrice per decidere e inizializzare l'ambiente senza chiedere:

1. **Scopo:** Landing page, sito SEO-oriented, blog, documentazione.
   - **Trigger Semantico:** "veloce", "SEO", "sito vetrina", "contenuti".
   - **Azione Automatica:** Scaffold di **Astro 5** (`bun create astro@latest`).

2. **Scopo:** Dashboard, CRM, App fortemente interattiva con stato complesso, SaaS.
   - **Trigger Semantico:** "pannello admin", "dashboard", "app SaaS", "gestionale".
   - **Azione Automatica:** Scaffold di **Nuxt 4 / Vue 3** (`npx nuxi@latest init`).

3. **Scopo:** Backend puro, API ad altissime performance, Microservizio.
   - **Trigger Semantico:** "microservizio", "API veloce", "backend", "websocket server".
   - **Azione Automatica:** Scaffold di **ElysiaJS / Bun** (`bun create elysia`).

4. **Scopo Multiplo (App complessa):**
   - **Azione Automatica:** Creare architettura monorepo `devboards-architecture` con cartelle separate per frontend (Astro), dashboard (Nuxt) e backend (Elysia).

## Comportamento Atteso dell'Agente

- **Non chiedere il permesso** su quale stack scegliere se l'intento semantico è chiaro. Applica la matrice di decisione.
- Annuncia la scelta architetturale nel blocco Trasparenza (`show-active-skill`).
- Esegui i comandi da terminale necessari per fare lo scaffolding, usando la modalità "non interattiva" (`--yes`, `--no-git`, ecc.).
