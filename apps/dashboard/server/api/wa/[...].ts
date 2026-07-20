/**
 * Nitro BFF Proxy per il microservizio wa-forge
 * Inoltra tutte le richieste /api/wa/** -> http://wa-forge:3010/wa/**
 */
import { defineEventHandler, proxyRequest } from 'nitropack/runtime'

export default defineEventHandler(async (event) => {
  const target = process.env.WAFORGE_MICROSERVICE_URL || 'http://wa-forge:3010'
  const path = event.context.params?._ || ''
  const search = event.node.req.url?.split('?')[1]
  const query = search ? `?${search}` : ''
  
  const url = `${target}/wa/${path}${query}`
  
  // Forward authorization header for JWT verification in Elysia
  return proxyRequest(event, url, {
    headers: {
      ...(event.node.req.headers.authorization && { authorization: event.node.req.headers.authorization })
    }
  })
})
