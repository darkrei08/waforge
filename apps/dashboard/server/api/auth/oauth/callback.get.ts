import { defineEventHandler, getQuery, sendRedirect, setCookie, createError } from 'h3'
import { prisma } from '../../../utils/prisma'
import { signJWT } from '../../../utils/jwt'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = query.code as string

  if (!code) {
    return sendRedirect(event, '/login?error=OAuth_No_Code')
  }

  const clientId = process.env.OAUTH_CLIENT_ID
  const clientSecret = process.env.OAUTH_CLIENT_SECRET
  const tokenUrl = process.env.OAUTH_TOKEN_URL
  const userInfoUrl = process.env.OAUTH_USERINFO_URL
  const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const redirectUri = `${appUrl}/api/auth/oauth/callback`

  if (!clientId || !clientSecret || !tokenUrl || !userInfoUrl) {
    return sendRedirect(event, '/login?error=OAuth_Non_Configurato')
  }

  try {
    // 1. Exchange code for token
    const tokenParams = new URLSearchParams()
    tokenParams.append('grant_type', 'authorization_code')
    tokenParams.append('client_id', clientId)
    tokenParams.append('client_secret', clientSecret)
    tokenParams.append('code', code)
    tokenParams.append('redirect_uri', redirectUri)

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: tokenParams.toString()
    })
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to get token')
    }

    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token

    // 2. Fetch User Info
    const userResponse = await fetch(userInfoUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    })

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info')
    }

    const userInfo = await userResponse.json()
    const email = userInfo.email
    const name = userInfo.name || userInfo.preferred_username || email.split('@')[0]

    if (!email) {
      return sendRedirect(event, '/login?error=OAuth_No_Email')
    }

    // 3. Find or Create User
    let user = await prisma.user.findUnique({
      where: { email },
      include: { memberships: true }
    })

    const usersCount = await prisma.user.count()
    const isSuperAdmin = usersCount === 0

    let teamId: string

    if (!user) {
      // Create Team for new user
      const team = await prisma.team.create({
        data: { name: `Team di ${name}` }
      })
      teamId = team.id

      // Create User with empty password since they use OAuth
      user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash: 'OAUTH_MANAGED',
          isSuperAdmin,
          memberships: {
            create: {
              teamId,
              role: 'OWNER'
            }
          }
        },
        include: { memberships: true }
      })
    } else {
      teamId = user.memberships[0]?.teamId
      if (!teamId) {
        // Fallback se l'utente non ha un team
        const team = await prisma.team.create({
          data: { name: `Team di ${name}` }
        })
        teamId = team.id
        await prisma.teamMembership.create({
          data: { userId: user.id, teamId, role: 'OWNER' }
        })
      }
    }

    // 4. Generate Internal JWT
    const jwtToken = await signJWT({ 
      userId: user.id, 
      teamId, 
      role: user.memberships.find(m => m.teamId === teamId)?.role || 'AGENT',
      isSuperAdmin: user.isSuperAdmin
    })

    // 5. Set Cookie
    const isSecure = appUrl.startsWith('https')
    setCookie(event, 'auth_token', jwtToken, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/'
    })

    return sendRedirect(event, '/')
  } catch (error) {
    console.error('OAuth Error:', error)
    return sendRedirect(event, '/login?error=OAuth_Failed')
  }
})
