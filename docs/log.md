# WA Sender Pro - Memory Log

## [2026-06-24 18:07] session | Rilascio v1.0.0 e porting a Nuxt 3 Nitro
Touched: [[Architettura WA Sender Pro]], [[Dual Engine WuzAPI-gowa]], [[Design System Stitch]]

- Migrato con successo da React/Next.js a **Nuxt 3 / Nitro H3**.
- Adozione di **Pinia** per lo state management e refactoring completo della UI (Vue 3 Composition API).
- Integrato il **Design System Stitch** per garantire componenti UI premium (Glassmorphism, Tailwind).
- Configurato supporto dual-engine con **WuzAPI** (default) e **gowa** come fallback.
- Push automatico e build Docker image via **GitHub Actions** (`ghcr.io/darkrei08/wa-sender-pro`).
