
# Template Accordo sul Trattamento dei Dati (DPA)
## Art. 28 GDPR

> Da compilare e sottoscrivere con ogni sub-responsabile del trattamento

---

## Checklist DPA per sub-responsabile

### Stato attuale:

| Fornitore | DPA necessario | Stato | Note |
|-----------|---------------|-------|------|
| Hosting provider / VPS (es. Hetzner, AWS) | Sì | Da verificare | Dipende dal provider infrastrutturale scelto dal Cliente |
| Provider SMTP / Email | Sì | Da verificare | Per le email transazionali |
| WuzAPI (Self-hosted) | No (Se sullo stesso server) | N/A | Dati processati in locale |
| Meta (WhatsApp Business API) | Sì (Se usato invece di WuzAPI) | Standard ToS Meta | Applicabile solo se si usa l'API ufficiale |

---

## Contenuto minimo del DPA (Art. 28(3))

Un DPA valido deve includere:

### 1. Oggetto e durata
- Descrizione dei servizi forniti
- Durata del trattamento

### 2. Natura e finalità del trattamento
- Quali operazioni vengono svolte sui dati
- Perché vengono trattati



### 3. Misure di Sicurezza Richieste (Art. 32)
Il sub-responsabile deve garantire (ove applicabile all'infrastruttura scelta):
- **Isolamento Docker**: I container (es. , , , ) devono comunicare esclusivamente tramite reti interne isolate (es. ).
- **Storage DB e Code**: Le istanze PostgreSQL e Redis devono negare l'accesso pubblico esterno.
- **WuzAPI e Webhook**: Eventuali instradamenti verso API esterne devono avvenire in tunnel sicuri (HTTPS).
- **Cifratura At-Rest**: Utilizzo di dischi crittografati per lo storage persistente dei volumi Docker.
