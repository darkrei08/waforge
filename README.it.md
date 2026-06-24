<p align="center">
  <img src="docs/screenshots/dashboard.png" alt="WA Sender Pro Dashboard" width="800" />
</p>

<h1 align="center">WA Sender Pro</h1>

<p align="center">
  <strong>Dashboard premium per l'invio massivo e personalizzato di messaggi WhatsApp.</strong>
  <br/>
  Progettata con architettura moderna, sicura e scalabile.
</p>

<p align="center">
  <a href="README.md">🇬🇧 Read in English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Nuxt_3-00DC82?style=for-the-badge&logo=nuxt.js&logoColor=white" alt="Nuxt 3" />
  <img src="https://img.shields.io/badge/Vue_3-4FC08D?style=for-the-badge&logo=vue.js&logoColor=white" alt="Vue 3" />
  <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/WhatsApp-25D366?style=for-the-badge&logo=whatsapp&logoColor=white" alt="WhatsApp" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/OWASP_Top_10-Compliant-4CAF50?style=flat-square" alt="OWASP" />
  <img src="https://img.shields.io/badge/NIST_CSF_2.0-Aligned-1976D2?style=flat-square" alt="NIST" />
  <img src="https://img.shields.io/badge/License-AGPLv3-red?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square" alt="Version" />
</p>

---

## 📸 Screenshots

> UI progettata con **Google Stitch** — Design System "Pro Connect" (Glassmorphism, Dark Mode nativa, WhatsApp Green palette).

| Dashboard | Connessione QR |
|:---------:|:--------------:|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Connect](docs/screenshots/connect.png) |

| Gestione Contatti | Campagne |
|:-----------------:|:--------:|
| ![Contacts](docs/screenshots/contacts.png) | ![Campaigns](docs/screenshots/campaigns.png) |

| Impostazioni | API Status Monitor |
|:------------:|:------------------:|
| ![Settings](docs/screenshots/settings.png) | ![API Status](docs/screenshots/api-status.png) |

---

## 🚀 Tech Stack

| Layer | Tecnologia | Note |
|-------|-----------|------|
| **Framework** | [Nuxt 3](https://nuxt.com) (Nitro Engine) | SSR, API Routes, Auto-imports |
| **UI** | [Vue 3](https://vuejs.org) + Composition API | `<script setup>`, Pinia state |
| **Runtime** | [Bun](https://bun.sh) | Ultra-fast JS runtime & package manager |
| **Styling** | [Tailwind CSS](https://tailwindcss.com) | Design System "Pro Connect" da Stitch |
| **ORM** | [Prisma](https://prisma.io) + SQLite | Typesafe, portabile, zero-config DB |
| **WhatsApp** | Dual Engine (WuzAPI / gowa) | Basati su whatsmeow, Multi-Device API |
| **Skeleton** | [phantom-ui](https://github.com/Aejkatappaja/phantom-ui) | Web Component skeleton loaders |
| **i18n** | @nuxtjs/i18n | Italiano / English |
| **Icons** | [Lucide Vue](https://lucide.dev) | 1400+ icone SVG ottimizzate |

### 🔌 Motori WhatsApp Supportati

Il progetto supporta **due backend WhatsApp** intercambiabili tramite variabile d'ambiente `WHATSAPP_ENGINE`:

| Engine | Repository | Protocollo | Default |
|--------|-----------|------------|---------|
| **WuzAPI** | [asternic/wuzapi](https://github.com/asternic/wuzapi) | REST API su whatsmeow | ✅ Primary |
| **gowa** | [aldinokemal/go-whatsapp-web-multidevice](https://github.com/aldinokemal/go-whatsapp-web-multidevice) | REST API su whatsmeow | Fallback |

Entrambi eliminano la dipendenza da browser/Selenium — comunicano direttamente col protocollo WhatsApp Web Multi-Device.

---

## 🏗️ Architettura

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (Vue 3 SPA)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │Dashboard │  │ Contacts │  │Campaigns │  │  Settings  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       └──────────────┼────────────┼───────────────┘         │
│                      ▼            ▼                          │
│              Pinia State Management                          │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/JSON
┌──────────────────────▼──────────────────────────────────────┐
│                  Nitro Server Engine                          │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐  │
│  │  API Routes  │  │  Middleware   │  │   Job Queue        │  │
│  │  /api/*      │  │  Rate Limit  │  │   (Async Sender)   │  │
│  │  Zod Valid.  │  │  Auth/CORS   │  │   Spintax + Jitter │  │
│  └──────┬───────┘  └──────────────┘  └─────────┬──────────┘  │
│         │                                       │             │
│  ┌──────▼───────┐                      ┌───────▼──────────┐  │
│  │ Prisma ORM   │                      │ WhatsApp Engine  │  │
│  │ (SQLite)     │                      │ (WuzAPI / gowa)  │  │
│  └──────────────┘                      └──────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                                                │
                                    ┌───────────▼────────────┐
                                    │   WhatsApp Multi-Device │
                                    │   (whatsmeow protocol)  │
                                    └────────────────────────┘
```

---

## 🔒 Sicurezza (Secure by Design)

Il progetto implementa rigorosamente le linee guida **OWASP Top 10** e **NIST CSF 2.0**:

| OWASP | Protezione | Implementazione |
|-------|-----------|-----------------|
| **A01** | Broken Access Control | Middleware auth, API key validation su `/api/*` |
| **A02** | Cryptographic Failures | Secret non esposti, HTTPS policy (HSTS) |
| **A03** | Injection | Prisma ORM (no raw SQL), Zod validation, XSS tag stripping, SSTI prevention |
| **A04** | Insecure Design | Rate limiting middleware, anti-ban jitter |
| **A05** | Security Misconfiguration | CSP, X-Frame-Options, no-sniff, `X-Powered-By` disabilitato |
| **A09** | Security Logging | Logger strutturato NIST CSF 2.0, audit trail per auth e injection |

---

## 📁 Struttura del Progetto

```
wa-sender-pro/
├── pages/               # Pagine Vue (file-based routing)
├── components/          # Componenti Vue riutilizzabili
├── layouts/             # Layout Sidebar + Theme/i18n
├── stores/              # Pinia State Management
├── lib/                 # Utility core
│   ├── whatsapp-engine.ts   # Astrazione dual engine
│   ├── wuzapi.ts            # Client WuzAPI
│   ├── csv-parser.ts        # Parser CSV/Excel
│   ├── validation.ts        # Zod schemas (OWASP A03)
│   ├── security-logger.ts   # Audit logger (NIST CSF 2.0)
│   └── spintax.ts           # Spintax engine (anti-ban)
├── server/              # Nitro API Routes
│   ├── api/             # REST endpoints
│   ├── middleware/       # Rate limit, auth, headers
│   └── utils/           # Prisma, job queue, helpers
├── prisma/              # Schema DB + migrazioni
├── locales/             # i18n (it.json, en.json)
├── docs/screenshots/    # Screenshot UI (Google Stitch)
├── Dockerfile           # Build produzione (Nitro)
└── docker-compose.yml   # Orchestrazione multi-container
```

---

## 🛠️ Quick Start

### Prerequisiti

- [Bun](https://bun.sh) >= 1.1
- [Docker](https://docker.com) (per WuzAPI/gowa)

### Installazione

```bash
# 1. Clona il repository
git clone https://github.com/darkrei08/wa-sender-pro.git
cd wa-sender-pro

# 2. Installa le dipendenze
bun install

# 3. Configura l'ambiente
cp .env.example .env
# Modifica .env con i tuoi valori (APP_SECRET, WUZAPI_TOKEN, ecc.)

# 4. Inizializza il database
bun run db:push

# 5. Avvia WuzAPI via Docker
docker-compose -f docker-compose.dev.yml up -d

# 6. Avvia il dev server
bun run dev
```

Apri [http://localhost:3000](http://localhost:3000) nel browser.

### 🐳 Docker (Produzione)

Tre opzioni per il deployment:

#### Opzione 1 — Immagine pre-built da GitHub Container Registry

L'immagine è disponibile su `ghcr.io` e viene aggiornata automaticamente ad ogni release:

```bash
# Pull dell'immagine
docker pull ghcr.io/darkrei08/wa-sender-pro:latest

# Avvio diretto (app sola, WuzAPI separato)
docker run -d \
  --name wa-sender-pro \
  -p 3000:3000 \
  -e WUZAPI_URL=http://host.docker.internal:3100 \
  -e WUZAPI_TOKEN=your-token \
  -e APP_SECRET=your-secret \
  -e DATABASE_URL=file:/app/data/wa-sender-pro.db \
  -v wa-sender-data:/app/data \
  ghcr.io/darkrei08/wa-sender-pro:latest
```

#### Opzione 2 — Docker Compose con immagine dal registry (consigliato)

Non serve clonare il repo. Crea un file `docker-compose.yml`:

```yaml
services:
  # ─── WhatsApp Engine: WuzAPI (primary) ────────────────────
  wuzapi:
    image: asternic/wuzapi:latest
    ports: ["3100:3100"]
    environment:
      WUZAPI_USERS: your-token
    volumes:
      - wuzapi_data:/app/dbdata

  # ─── WhatsApp Engine: gowa (fallback/alternativa) ─────────
  gowa:
    image: aldinokemal/go-whatsapp-web-multidevice:latest
    ports: ["3001:3000"]
    environment:
      GOWA_AUTH_TOKEN: your-token
    volumes:
      - gowa_data:/app/storages

  # ─── WA Sender Pro ────────────────────────────────────────
  wa-sender-pro:
    image: ghcr.io/darkrei08/wa-sender-pro:latest
    ports: ["3000:3000"]
    environment:
      # Scegli quale engine usare: "wuzapi" o "gowa"
      WHATSAPP_ENGINE: wuzapi
      WUZAPI_URL: http://wuzapi:3100
      WUZAPI_TOKEN: your-token
      GOWA_URL: http://gowa:3000
      GOWA_TOKEN: your-token
      APP_SECRET: change-me-to-random-string
      DATABASE_URL: file:/app/data/wa-sender-pro.db
    volumes:
      - app_data:/app/data
    depends_on: [wuzapi, gowa]

volumes:
  wuzapi_data:
  gowa_data:
  app_data:
```

```bash
docker-compose up -d
```

#### Opzione 3 — Build locale

```bash
git clone https://github.com/darkrei08/wa-sender-pro.git
cd wa-sender-pro
docker-compose up -d --build
```

> [!TIP]
> Le immagini sono disponibili per `linux/amd64` e `linux/arm64`. Tag disponibili: `latest`, `v1.0.0`, `sha-<commit>`.

---

## ⚖️ Licenza

Questo progetto è rilasciato sotto licenza **GNU Affero General Public License v3.0 (AGPLv3)**.

> [!IMPORTANT]
> La licenza AGPLv3 è una licenza copyleft forte. Questo significa che se modifichi questo software e lo rendi disponibile ad altri tramite una rete (es. come SaaS, API o servizio web), **devi rilasciare il codice sorgente delle tue modifiche sotto la stessa licenza AGPLv3**.
> 
> Se un developer procede allo sviluppo basato su questo codice per un servizio pubblico in rete, il codice derivato deve essere rilasciato in formato open source.

Vedi il file [LICENSE](LICENSE) per tutti i dettagli.
