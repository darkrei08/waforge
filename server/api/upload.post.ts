import { defineEventHandler, createError, readMultipartFormData } from 'h3'
import { join } from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  // Ensure the user is authenticated (assuming global middleware protects it, but we can rely on event.context.user)
  if (!event.context.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No file uploaded' })
  }

  // Trova il primo field che contiene dati del file (di solito con "filename")
  const fileField = formData.find(f => f.filename)
  if (!fileField || !fileField.filename || !fileField.data) {
    throw createError({ statusCode: 400, statusMessage: 'File non valido' })
  }

  // Prepara la cartella di destinazione
  // In ambiente Docker, salveremo in /app/data/uploads, che è mappato al volume.
  // In ambiente locale (sviluppo) useremo una cartella data/uploads nella root.
  const uploadDir = join(process.cwd(), 'data', 'uploads')
  
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true })
  }

  // Genera un nome file unico per evitare collisioni
  const ext = fileField.filename.split('.').pop()
  const uniqueName = `${crypto.randomUUID()}.${ext}`
  const filePath = join(uploadDir, uniqueName)

  // Salva il file
  await writeFile(filePath, fileField.data)

  // Costruisci l'URL assoluto. Usa NUXT_PUBLIC_APP_URL, altrimenti ripiega sull'host corrente.
  const baseUrl = process.env.NUXT_PUBLIC_APP_URL || `http://${event.node.req.headers.host}`
  const fileUrl = `${baseUrl}/api/media/${uniqueName}`

  return {
    data: {
      url: fileUrl,
      filename: uniqueName,
      mimetype: fileField.type
    }
  }
})
