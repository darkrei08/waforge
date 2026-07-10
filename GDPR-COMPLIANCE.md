
# GDPR Compliance Checklist — WaForge

> Ultimo aggiornamento: 2026-05-19
> Riferimenti normativi: GDPR (EU 2016/679), Codice Privacy (D.Lgs. 196/2003 mod. D.Lgs. 101/2018), Linee Guida Garante Cookie (luglio 2021), Decisione Garante 330/2025 (double opt-in)

Legenda: ✅ Conforme | ⚠️ Parziale | ❌ Mancante | 🔧 In corso

---

## A. COOKIE & CONSENSO (ePrivacy + GDPR)

| # | Requisito | Stato | Note |
|---|-----------|-------|------|
| A1 | Cookie banner con "Accetta" e "Rifiuta" ugualmente visibili | ✅ | CookieBanner.astro — 3 pulsanti equipollenti |
| A2 | Opzioni granulari per categoria (necessari, analitici, marketing) | ✅ | Pannello "Personalizza" con toggle |
| A3 | Blocco tecnico cookie non essenziali prima del consenso | ✅ | Analytics, Google Maps, Trustindex, Cal.com condizionati a consenso. Turnstile è essenziale. Google Fonts self-hosted (nessuna connessione a Google). |
| A4 | Chiusura banner (X) = nessun consenso dato | ✅ | X = solo cookie tecnici |
| A5 | No cookie wall (contenuto accessibile senza consenso) | ✅ | Nessun contenuto bloccato |
| A6 | Re-prompt non prima di 6 mesi dalla scelta | ✅ | Cookie 6 mesi + check timestamp |
| A7 | Revoca consenso facile quanto il conferimento | ✅ | "Gestisci cookie" nel footer |
| A8 | Registro consensi cookie (audit trail) | ✅ | Tabella cookie_consents + endpoint API |
| A9 | Link a cookie policy nel banner | ✅ | Link presente nel banner |
| A10 | Cookie policy con elenco completo cookie | ✅ | Tabelle dettagliate per categoria + terze parti (Google Maps, Trustindex, Cal.com) |

## B. PRIVACY POLICY (Artt. 13-14 GDPR)

| # | Requisito | Stato | Note |
|---|-----------|-------|------|
| B1 | Identità e contatti del titolare | ✅ | [nome titolare] + [VAT] + [email titolare] + [telefono titolare] |
| B2 | Finalità e basi giuridiche per ogni trattamento | ✅ | Tabella completa nella sezione 3 |
| B3 | Categorie di dati raccolti | ✅ | Sezione 2 dettagliata |
| B4 | Destinatari / categorie destinatari | ✅ | Sezione 7 + tabella sub-responsabili |
| B5 | Trasferimenti extra-UE e garanzie | ✅ | Sezione 9 — DPF + SCCs |
| B6 | Periodi di conservazione per ogni categoria | ✅ | Tabella nella sezione 6 |
| B7 | Diritti dell'interessato (artt. 15-22) | ✅ | Sezione 11 dettagliata |
| B8 | Diritto di revoca consenso | ✅ | Sezione 11 |
| B9 | Diritto di reclamo al Garante con contatti | ✅ | Sezione 12 con indirizzo/email/PEC/sito |
| B10 | Se il conferimento dati è obbligatorio/volontario | ✅ | Sezione 4 |
| B11 | Decisioni automatizzate / profilazione | ✅ | Sezione 10 — dichiarazione assenza |
| B12 | Accessibile da ogni pagina del sito | ✅ | Link nel footer |
| B13 | In lingua italiana | ✅ | |
| B14 | Aggiornamento con tutti i sub-responsabili attuali | ✅ | WuzAPI (se esterno), Hosting VPS del Cliente |

## C. FORM DI CONTATTO (Art. 6(1)(b) GDPR)

| # | Requisito | Stato | Note |
|---|-----------|-------|------|
| C1 | Informativa breve visibile al punto di raccolta | ✅ | Testo inline con base giuridica e retention |
| C2 | Checkbox GDPR obbligatoria (non pre-selezionata) | ✅ | Implementata in tutti e 3 i form |
| C3 | Link alla privacy policy | ✅ | Link a /privacy-policy |
| C4 | Minimizzazione dati (solo campi necessari) | ✅ | Telefono/azienda opzionali, IP non salvato |
| C5 | Periodo conservazione definito e implementato | ✅ | 24 mesi, funzione purge_old_contacts() |
| C6 | Possibilità di cancellazione su richiesta | ✅ | Endpoint /gdpr-requests/erase + pagina pubblica |

## D. NEWSLETTER (Consenso esplicito + Decisione Garante 330/2025)

| # | Requisito | Stato | Note |
|---|-----------|-------|------|
| D1 | Double opt-in | ✅ | Implementato con confirmation_token |
| D2 | Consenso separato (non accorpato ad altri consensi) | ✅ | Form dedicato |
| D3 | Link unsubscribe in ogni email | ✅ | sendNewsletterEmail() con footer unsubscribe |
| D4 | Prova del consenso (timestamp, IP, versione policy) | ✅ | Timestamp + IP + user-agent al subscribe e al confirm (migration 103, 2026-05-24) |
| D5 | Informativa al punto di iscrizione | ✅ | Testo sotto SubscribeForm |
| D6 | Link privacy policy sul form di iscrizione | ✅ | Link a /privacy-policy |

## E. ANALYTICS & TRACCIAMENTO

| # | Requisito | Stato | Note |
|---|-----------|-------|------|
| E1 | Consenso preventivo per analytics non essenziali | ✅ | Condizionato a cookie_consent.analytics |
| E2 | IP anonimizzato o pseudonimizzato | ✅ | Ultimo ottetto azzerato (anonymizeIp) |
| E3 | Periodo di conservazione definito e implementato | ✅ | 26 mesi, purge_old_analytics() |
| E4 | Informativa privacy copre analytics self-hosted | ✅ | Sezione 3 e cookie policy sezione 2.3 |
| E5 | Nessun tracking cross-site | ✅ | Analytics solo first-party |

## F. ADMIN PANEL & SICUREZZA

| # | Requisito | Stato | Note |
|---|-----------|-------|------|
| F1 | Account individuali (no credenziali condivise) | ✅ | JWT per utente |
| F2 | Hashing password robusto | ✅ | bcrypt 12 rounds |
| F3 | Cookie HttpOnly + SameSite | ✅ | auth_token HttpOnly SameSite=Strict |
| F4 | Rate limiting login | ✅ | 5 tentativi / 15 min |
| F5 | Audit trail accessi e modifiche dati | ✅ | Migration 012 audit_logging |
| F6 | MFA / 2FA | ✅ | TOTP RFC 6238 self-contained (`lib/totp.ts`, ±1 step skew, timing-safe). Enrollment wizard `impostazioni/mfa-section.tsx`, 2-step login con `mfa_required`. 10 backup codes bcrypt-hashed (rounds 12). Secret cifrato con envelope encryption (`crypto.ts`). Migration 102. Verificato 2026-05-24. |
| F7 | Timeout sessione per inattività | ✅ | 30 min timeout via last_activity check |
| F8 | HTTPS obbligatorio | ✅ | HSTS header in produzione |
| F9 | Principio del minimo privilegio | ⚠️ | Solo ruolo admin, no granularità (accettabile per freelancer) |
| F10 | Security headers | ✅ | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy |

## G. DIRITTI DELL'INTERESSATO (Artt. 15-22)

| # | Requisito | Stato | Note |
|---|-----------|-------|------|
| G1 | Meccanismo per richieste (email/form dedicato) | ✅ | Pagina /privacy-request + endpoint API |
| G2 | Risposta entro 30 giorni | ✅ | Email notifica admin con reminder |
| G3 | Diritto di accesso (export dati personali) | ✅ | Endpoint /gdpr-requests/export/:email |
| G4 | Diritto di rettifica | ✅ | Via form o email + gestione admin |
| G5 | Diritto di cancellazione (oblio) | ✅ | Endpoint /gdpr-requests/erase/:email — elimina contacts/newsletter/preferenze/WhatsApp/portal_login_events e **anonimizza** customers/leads (fatture e pagamenti collegati restano per obbligo fiscale 1


## H. MISURE TECNICHE E ORGANIZZATIVE (Art. 32)

| # | Requisito | Stato | Note (Architettura WaForge) |
|---|-----------|-------|-----------------------------|
| H1 | Crittografia in transito | ✅ | Tutto il traffico API, Webhook (WuzAPI) e Client è cifrato tramite HTTPS/TLS 1.2+ (gestito da proxy inverso del Cliente). |
| H2 | Protezione del Database | ✅ | Dati residenti in PostgreSQL isolato via Docker network privata. Accesso limitato all'applicazione backend (Nuxt Nitro). |
| H3 | Coda e Job asincroni sicuri | ✅ | Utilizzo di Redis e BullMQ. I job di invio massivo vengono smaltiti e i task elaborati (campagne) mantengono solo l'esito; i payload volatili decadono col TTL. |
| H4 | Minimizzazione log e PII Scrubber | ✅ | Segue policy legal-scaffold: i numeri di telefono o nomi nei log applicativi vengono anonimizzati o mascherati, non persistendo in file di testo in chiaro. |
| H5 | Gestione containerizzata | ✅ | Isolamento dei processi tramite Docker Compose, WuzAPI gira in ambiente sandbox per prevenire data leak tra l'app WaForge e il layer Meta. |
