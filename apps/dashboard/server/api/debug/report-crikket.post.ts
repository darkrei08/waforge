import { defineEventHandler, readBody } from 'h3'
import { reportBugToCrikket } from '~/server/utils/crikket-client'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    if (!body || (!body.title && !body.message)) {
      return { success: false, error: 'Title or message required' }
    }

    const result = await reportBugToCrikket({
      title: body.title || body.message || 'Errore Runtime Catturato',
      description: body.description || body.message || 'Dettagli non forniti',
      stack: body.stack || '',
      source: body.source || 'DebugWidget Studio',
      level: body.level || 'error',
      environment: body.environment,
      metadata: body.metadata || {}
    })

    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
})
