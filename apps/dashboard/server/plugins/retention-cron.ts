import { runDataRetention } from '../utils/retention'

export default defineNitroPlugin((nitroApp) => {
  // Esegui subito all'avvio (opzionale)
  // runDataRetention()

  // Esegui ogni 24 ore (86400000 ms)
  setInterval(() => {
    runDataRetention()
  }, 24 * 60 * 60 * 1000)

  console.log('[Retention] Cron job per la pulizia dati configurato (ogni 24h).')
})
