/**
 * Prisma Client Singleton for Nitro Runtime
 * Avoids exhausting database connections during HMR in development.
 */

import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

// Utility per costruire il DB URL evitando problemi di dotenv-expand in Nitro
const getDbUrl = () => {
  // Se la variabile esiste e non contiene sintassi non espansa come ${POSTGRES_USER}
  if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('${')) {
    return process.env.DATABASE_URL
  }
  
  // Costruzione manuale per il runtime usando le variabili iniettate
  const user = process.env.POSTGRES_USER || 'postgres'
  const pass = process.env.POSTGRES_PASSWORD || 'postgres'
  const host = process.env.POSTGRES_HOST || 'localhost'
  const port = process.env.POSTGRES_PORT || '5432'
  const db = process.env.POSTGRES_DB || 'wasender' // O 'waforge' se preferisci

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
