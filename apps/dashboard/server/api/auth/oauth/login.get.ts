import { defineEventHandler, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
  const clientId = process.env.OAUTH_CLIENT_ID
  const authorizeUrl = process.env.OAUTH_AUTHORIZE_URL
  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (!clientId || !authorizeUrl) {
    return sendRedirect(event, '/login?error=OAuth_Non_Configurato')
  }

  const redirectUri = `${appUrl}/api/auth/oauth/callback`
  const state = Math.random().toString(36).substring(7)
  
  // Construct OAuth URL (Assuming standard OAuth2 / OIDC)
  const url = new URL(authorizeUrl)
  url.searchParams.append('client_id', clientId)
  url.searchParams.append('redirect_uri', redirectUri)
  url.searchParams.append('response_type', 'code')
  url.searchParams.append('scope', 'openid profile email')
  url.searchParams.append('state', state)

  return sendRedirect(event, url.toString())
})
