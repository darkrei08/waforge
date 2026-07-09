import { defineEventHandler, getRouterParam, createError, setResponseHeader } from 'h3'
import { join } from 'path'
import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import mime from 'mime'

export default defineEventHandler(async (event) => {
  const filename = getRouterParam(event, 'filename')
  if (!filename) {
    throw createError({ statusCode: 400, statusMessage: 'Missing filename' })
  }

  // Preveniamo path traversal attacks
  if (filename.includes('/') || filename.includes('\\') || filename.includes('..')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid filename' })
  }

  const uploadDir = join(process.cwd(), 'data', 'uploads')
  const filePath = join(uploadDir, filename)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  // Leggi il file dal disco
  const fileData = await readFile(filePath)
  
  // Determina il mimetype
  const mimeType = mime.getType(filePath) || 'application/octet-stream'
  setResponseHeader(event, 'Content-Type', mimeType)
  
  // Opzionale: Aggiungi header di cache per performance
  setResponseHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')

  return fileData
})
