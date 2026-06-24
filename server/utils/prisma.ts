/**
 * Prisma Client Singleton for Nitro Runtime
 * Avoids exhausting database connections during HMR in development.
 */

import { PrismaClient } from '@prisma/client/index.js'

let prisma: PrismaClient

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Legge dinamicamente process.env a runtime aggirando il bundler
const getEnv = (key: string) => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key]
  }
  return undefined
}

// Utility per costruire il DB URL evitando problemi di dotenv-expand in Nitro
const getDbUrl = () => {
  let dbUrl = getEnv('DATABASE_URL') || getEnv('NUXT_DATABASE_URL')
  
  // Se la variabile esiste e non contiene sintassi non espansa come ${POSTGRES_USER}
  if (dbUrl && !dbUrl.includes('${')) {
    return dbUrl
  }
  
  // Costruzione sicura per il runtime usando le variabili iniettate
  const user = getEnv('POSTGRES_USER') || 'postgres'
  const pass = getEnv('POSTGRES_PASSWORD') || 'postgres'
  const host = getEnv('POSTGRES_HOST') || 'localhost'
  const port = getEnv('POSTGRES_PORT') || '5432'
  const db = getEnv('POSTGRES_DB') || 'waforge'

  // Security Check: Non permettere l'uso di credenziali di default in produzione se le variabili d'ambiente non sono fornite
  const isProd = getEnv('NODE_ENV') === 'production'
  if (isProd && (!getEnv('POSTGRES_PASSWORD') || !getEnv('POSTGRES_USER'))) {
    console.warn('⚠️ [SECURITY WARNING] POSTGRES_USER o POSTGRES_PASSWORD non definiti in produzione. Utilizzo dei fallback locali, il che rappresenta un rischio di sicurezza (CWE-798).')
    // In un sistema strict si dovrebbe lanciare un errore:
    // throw new Error("Missing secure database credentials in production environment.")
  }

  return `postgresql://${user}:${pass}@${host}:${port}/${db}?schema=public`
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    datasourceUrl: getDbUrl(),
    log: ['error']
  })
} else {
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      datasourceUrl: getDbUrl(),
      log: ['query', 'error', 'warn'],
    })
  }
  prisma = globalThis.__prisma
}

export { prisma }
