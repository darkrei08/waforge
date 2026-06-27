# WaForge - LLM Development Guide

This document provides a comprehensive technical overview of the **WaForge** project to assist Large Language Models (LLMs) or AI agents in understanding the architecture, features, and design system when contributing to or modifying the codebase.

## 1. Project Overview

**WaForge** is a premium web dashboard designed for mass and personalized WhatsApp messaging. It allows users to connect multiple WhatsApp accounts via QR code, manage contacts, create templates, and launch mass messaging campaigns with built-in anti-ban features.

### Core Architecture
- **Frontend Framework**: Nuxt 3 (Vue 3, Composition API)
- **Backend Framework**: Nuxt 3 (Nitro Engine)
- **Database**: PostgreSQL (via Prisma ORM)
- **WhatsApp Engine**: Dual support for [WuzAPI](https://github.com/asternic/wuzapi) and [gowa](https://github.com/aldinokemal/go-whatsapp-web-multidevice). These communicate directly with WhatsApp Web Multi-Device protocol.
- **Styling**: Tailwind CSS
- **Runtime**: Node.js / Bun
- **Authentication**: JWT-based authentication + OAuth2/SSO (e.g., PocketID).

---

## 2. Key Features and Functions

1. **Authentication & Teams**
   - **Login/Register**: Supports standard email/password and OAuth2/SSO.
   - **Teams**: Users are organized into teams. A user can be `OWNER`, `ADMIN`, or `AGENT`.
   - **Invites**: Owners/Admins can invite users via email (SMTP) to join their team. Invites use secure JWT tokens valid for 48 hours.

2. **WhatsApp Device Management (`/devices`)**
   - Users can connect multiple WhatsApp numbers.
   - Devices can be customized with a **Name**, **Description**, and **Tags** for easy identification.
   - Disconnecting a device deletes the session from both the database and the underlying WhatsApp Engine.

3. **Contacts Management (`/contacts`)**
   - Import/Export contacts via CSV.
   - Tagging system for precise targeting during campaigns.
   - Data is strictly isolated per Team.

4. **Templates (`/templates`)**
   - Supports variables like `{{Name}}`, `{{Phone}}`, `{{Email}}`, `{{Company}}`.
   - Supports WhatsApp formatting (`*bold*`, `_italic_`, `~strikethrough~`).

5. **Campaigns (`/campaigns`)**
   - Mass messaging feature combining Contacts and Templates.
   - Implements **Anti-ban Jitter**: Random delay (min/max) between each message to simulate human behavior.
   - **Spintax**: Supports Spintax (e.g., `{Hello|Hi|Greetings}`) to randomize message structures.

6. **Security (OWASP & NIST Aligned)**
   - **Rate Limiting**: Sliding window rate limiter (`server/middleware/rate-limit.ts`) restricted to 10 requests/min for Auth endpoints and 120/min for others.
   - **Zod Validation**: Strict schema validation for all API inputs.
   - **Security Logger**: NIST CSF 2.0 aligned audit trail (`lib/security-logger.ts`).

---

## 3. Design System ("Pro Connect")

WaForge utilizes a premium design system named **"Pro Connect"** (designed with Google Stitch concepts). When implementing new UI components, strictly follow these aesthetic guidelines:

### Core Principles
- **Glassmorphism**: Heavy use of translucent backgrounds (`bg-surface-container/50 backdrop-blur-md`).
- **Dark Mode Native**: The UI is optimized for a sleek dark mode. Always use `dark:` variants (e.g., `dark:bg-white/5`, `dark:border-white/10`).
- **WhatsApp Green Palette**: The primary brand color is WhatsApp Green (`#25D366`), used for primary buttons, active states, and glowing elements.

### Tailwind Classes Convention
- **Containers**: `bg-surface-container`, `border border-black/5 dark:border-white/5`, `rounded-2xl`, `shadow-xl`.
- **Typography**: 
  - Headings: `text-on-surface`, `font-bold` (Inter font family implicitly).
  - Subtitles/Labels: `text-on-surface-variant`, `text-sm`, `font-medium`.
- **Inputs**: `bg-black/5 dark:bg-white/5`, `border border-black/10 dark:border-white/10`, `rounded-lg`, `focus:border-primary`, `px-4 py-2.5`.
- **Buttons**:
  - Primary: `bg-primary hover:bg-primary-fixed-dim text-surface font-semibold rounded-lg`.
  - Secondary/Cancel: `bg-surface-variant hover:bg-white/5 text-on-surface font-semibold rounded-lg`.
- **Animations/Transitions**: Always add `transition-colors` or `transition-all` to interactive elements.

### Examples of good UI patterns:
- Use Lucide Vue icons (`lucide-vue-next`) for UI elements.
- When creating tables, wrap them in `overflow-x-auto` with `divide-y divide-black/5 dark:divide-white/10` and use `hover:bg-white/5` on rows.

---

## 4. Workflow Rules for LLMs

1. **Database Changes**: Always update `prisma/schema.prisma` first, then run `npx prisma migrate dev --name <migration_name>` to apply changes to the PostgreSQL database.
2. **API Routes**: Nuxt Nitro is used for APIs (`server/api/`). Always validate `readBody(event)` using Zod. Ensure data is scoped by `event.context.user.teamId` to prevent Broken Access Control (OWASP A01).
3. **Dependencies**: Use `npm run dev` or `bun run dev` for local server. The project uses `bun` or `npm` interchangeably, but Docker uses Node/Prisma directly.
4. **Translations**: The project uses `@nuxtjs/i18n`. Hardcoded Italian/English text in Vue templates should ideally be mapped to `locales/it.json` and `locales/en.json` via `$t('key')`.

---
*Generated for AI context alignment.*
