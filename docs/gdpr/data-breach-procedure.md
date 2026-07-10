
# Procedura Notifica Data Breach
## Art. 33-34 GDPR

> Ultimo aggiornamento: 19 Marzo 2026

---

## 1. Definizione

Una violazione dei dati personali ("data breach") è una violazione della sicurezza che comporta accidentalmente o in modo illecito la distruzione, la perdita, la modifica, la divulgazione non autorizzata o l'accesso ai dati personali.

## 2. Rilevamento

### Fonti di rilevamento:
- Alert di sicurezza del server/hosting
- Segnalazioni da utenti o clienti
- Log di audit anomali
- Notifiche da sub-responsabili (Cloudflare, Resend, Stripe, ecc.)
- Controlli di routine

### Indicatori di violazione:
- Accessi non autorizzati ai database
- Leak di credenziali
- Malware/ransomware
- Perdita di backup
- Invio email non autorizzato
- Esposizione di dati personali su canali pubblici

## 3. Workflow di gestione

### Fase 1: Contenimento (immediate, entro 1 ora)
- [ ] Identificare la natura e l'ambito della violazione
- [ ] Isolare i sistemi compromessi
- [ ] Cambiare credenziali compromesse
- [ ] Preservare le evidenze (log, screenshot, timestamp)

### Fase 2: Valutazione del rischio (entro 12 ore)
- [ ] Quali dati sono coinvolti? (categoria e volume)
- [ ] Quanti interessati sono coinvolti?
- [ ] La violazione è probabile che presenti un rischio per i diritti e le libertà?
- [ ] I dati erano cifrati o pseudonimizzati?
- [ ] Qual è la gravità potenziale delle conseguenze?

### Matrice di rischio:

| Tipo di dati | Volume | Cifratura | Rischio |
|-------------|--------|-----------|---------|
| Email + nome | < 100 | No | Medio |
| Email + nome | > 100 | No | Alto |
| Dati fatturazione | Qualsiasi | No | Alto |
| Dati anonimizzati | Qualsiasi | - | Basso |
| Password (hashed) | 

