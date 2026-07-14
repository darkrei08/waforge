import { verifyJWT } from '../utils/jwt'
import { getCookie, getHeader } from 'h3'

export default defineEventHandler(async (event) => {
  const publicRoutes = ['/api/auth/login', '/api/auth/register', '/api/auth/invite', '/api/auth/oauth', '/api/auth/logout', '/api/webhook']
  if (publicRoutes.some(route => event.path.startsWith(route))) return

  // Applica l'auth solo alle chiamate API
  if (!event.path.startsWith('/api/')) return

  const token = getCookie(event, 'auth_token') || getHeader(event, 'authorization')?.replace('Bearer ', '')
  
  if (!token) {
    throw createError({ statusCode: 401, message: 'Non autorizzato' })
  }

  const payload = await verifyJWT(token)
  if (!payload) {
    throw createError({ statusCode: 401, message: 'Token invalido o scaduto' })
  }

  // Inietta l'utente e il team nel contesto dell'evento, 
  // così ogni endpoint API può filtrare i dati in base al teamId
  event.context.user = payload
})
