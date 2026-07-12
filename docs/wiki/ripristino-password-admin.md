---
title: Ripristino Password Amministratore (Admin Recovery)
date: 2026-07-12
tags: [admin, password, recovery, security, cli, docker, on-premise]
---
# 🔐 Ripristino Password Amministratore (`Admin Recovery Tool`)

In **WaForge** (SaaS Multi-Tenant e On-Premise Dockerizzato), gli amministratori di sistema (`SuperAdmin`) e i gestori del server possono recuperare o reimpostare le credenziali in modo sicuro tramite terminale locale o all'interno del container Docker principale (`waforge-app`). 

Questo approccio elimina i rischi legati a tentativi di recupero web non autenticati (in assenza di configurazione SMTP attiva) o ad attacchi di forza bruta su form pubblici.

## 🛠️ Comando di Verifica ed Elenco Utenti

Se hai dimenticato quale indirizzo email è associato all'amministratore principale o vuoi verificare lo stato dei `SuperAdmin` nel database PostgreSQL, lancia il comando senza parametri:

### In ambiente locale (Bun/Node.js):
```bash
bun run admin:reset-password
```

### All'interno di Docker (Produzione):
```bash
docker exec -it waforge-app bun run admin:reset-password
```

> [!TIP]
> **Nota Docker**: A partire dalla versione `v2.15.1` (o con l'ultima build da `Dockerfile`), il runtime `bun` e gli strumenti CLI sono inclusi nativamente nell'immagine di produzione `waforge-app`. Se riscontri l'errore `exec: "bun": executable file not found`, ricrea il container con:
> `docker compose pull && docker compose up -d --build`

**Output di esempio:**
```
🔐 === WaForge Administrator Password Reset Utility ===

Utilizzo:
  bun run admin:reset-password --email admin@example.com --password NuovaPassword123!
  oppure:
  bun run bin/reset-admin-password.ts admin@example.com NuovaPassword123!

Elenco utenti amministratori presenti nel database:
  - [admin@admin.com] (admin) - SuperAdmin: true
```

---

## ⚡ Reimpostazione della Password

Per assegnare una nuova password a qualsiasi account (amministratore o utente standard), specifica l'indirizzo email e la nuova password in chiaro. L'utility si occuperà di applicare l'hashing crittografico sicuro (`bcrypt` a 10 round) direttamente su database.

### In ambiente locale:
```bash
bun run admin:reset-password --email admin@admin.com --password NuovaPassword123!
```

### All'interno di Docker (Produzione):
```bash
docker exec -it waforge-app bun run admin:reset-password --email admin@admin.com --password NuovaPassword123!
```

**Output di conferma:**
```
✅ === PASSWORD RIPRISTINATA CON SUCCESSO ===
👤 Utente: admin (admin@admin.com)
🛡️ SuperAdmin: SÌ
🔑 Nuova Password: NuovaPassword123!
```

---

## 🐞 Risoluzione Problemi, Debug Widget e Diagnostica LLM/MCP

Se necessiti di analizzare le chiamate API di autenticazione, la generazione LLM o l'esecuzione dei tool MCP in tempo reale:
1. **Debug Widget Frontend**: È sempre abilitato a runtime in `app.vue`. Se il pannello è chiuso o minimizzato, clicca sul pulsante flottante **`🐞 Debugger`** in basso a destra per riaprirlo istantaneamente e verificare store Pinia e network del browser.
2. **Log Strutturati LLM/MCP in Docker**: Tutte le interazioni di modellazione AI e le chiamate agli strumenti MCP generano log diagnostici strutturati sul terminale del container con i prefissi `[waforge-llm]` e `[waforge-mcp-agent]`. Per monitorare in tempo reale prompt, esecuzione tool e failover:
   ```bash
   docker logs -f waforge-app
   ```
3. **Compatibilità Modelli**: Assicurati di utilizzare i modelli supportati dalle API recenti (es. `gemini-2.5-flash` o `gemini-2.5-pro` per Google Gemini, poiché la serie 1.5 restituisce 404/Not Found sulle nuove API chiave).

