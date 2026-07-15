# Guida alla Configurazione di WaForge

Benvenuto in WaForge! Questo documento ti guiderà attraverso la configurazione dell'applicazione, la personalizzazione del marchio (White Label) e l'impostazione dei pagamenti con Stripe per scalare il tuo modello di business SaaS.

## 1. Configurazione del Marchio (White Label)

WaForge è progettato per essere completamente "White Label". Non troverai il nome "WaForge" sparso per il codice; tutte le informazioni sono centralizzate.

Per personalizzare il frontend di Astro, apri il file:
`apps/frontend/src/config.ts`

Qui potrai modificare:
- **Nome del Brand**
- **Ragione Sociale e Partita IVA**
- **Email di Supporto**
- **Link ai Social**

Ogni modifica a questo file si rifletterà automaticamente in tutte le pagine (Header, Footer, Privacy Policy, Termini e Condizioni, ecc.).

## 2. Variabili d'Ambiente (.env)

Il progetto richiede alcune variabili d'ambiente per funzionare correttamente.
Assicurati di copiare il file `.env.example` in `.env` nella cartella root e nella cartella `apps/dashboard`.

I parametri più importanti sono:
- `DATABASE_URL`: La stringa di connessione al database PostgreSQL.
- `APP_SECRET`: Una stringa lunga almeno 32 caratteri usata per firmare i JWT.
- `NUXT_PUBLIC_APP_URL`: L'URL pubblico della dashboard (es. `https://app.tuodominio.com`).
- `STRIPE_SECRET_KEY`: (Spiegato di seguito).

## 3. Configurazione di Stripe (Pagamenti e Abbonamenti)

WaForge è integrato nativamente con Stripe per gestire i tre livelli di abbonamento (Free, Business, Enterprise) e applicare automaticamente i limiti sulle risorse (numero di messaggi, dispositivi, contatti).

### Come impostare Stripe:

1. Registrati su [Stripe.com](https://stripe.com) e accedi alla Dashboard.
2. Recupera la tua **Chiave Segreta** (inizia con `sk_test_...` per i test, e `sk_live_...` per la produzione) nella sezione *Sviluppatori > Chiavi API*.
3. Vai in *Catalogo Prodotti* e crea **2 Prodotti** con fatturazione ricorrente (mensile/annuale):
   - **Piano Business** (es. €49/mese)
   - **Piano Enterprise** (es. €149/mese)
4. Una volta creati i prezzi, copia i **Price ID** (iniziano con `price_...`).
5. Apri i file `.env` del progetto e inserisci queste chiavi:

```env
STRIPE_SECRET_KEY=sk_test_...tua_chiave_stripe...
STRIPE_PRICE_PRO=price_1xxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE=price_1yyyyyyyyyyyyyyyyyyyyy
```

### Limiti dei Piani

Attualmente, il sistema ha i seguenti limiti preimpostati (configurati in `apps/dashboard/server/utils/planLimits.ts`):
- **FREE:** 1 Dispositivo WA, Max 10 Contatti, 1 Rubrica.
- **PRO (Business):** 3 Dispositivi WA, Contatti e Rubriche illimitate.
- **ENTERPRISE:** Nessun limite.

Per modificare questi limiti o aggiungere altre logiche anti-frode, modifica l'oggetto `PLAN_LIMITS` all'interno di `planLimits.ts`.

## 4. Gestione Utenti (RBAC e Super Admin)

Il primo utente che si registra sul sistema diventa automaticamente **Super Admin** (`isSuperAdmin: true`). Questo utente non subisce alcuna restrizione RBAC per le funzionalità amministrative e potrà visualizzare eventuali futuri pannelli di amministrazione globale.

Gli utenti successivi che si registrano creeranno in automatico un proprio "Team" con il piano "FREE", subendo i vincoli di sistema finché non effettueranno l'upgrade. Se la fatturazione scade (Stripe invia webhooks non ancora interamente mappati, da approfondire se necessario) l'utente può essere limitato nuovamente.
