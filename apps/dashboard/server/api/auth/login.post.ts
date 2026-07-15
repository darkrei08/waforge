import bcrypt from 'bcryptjs'
import { prisma } from '../../utils/prisma'
import { signJWT } from '../../utils/jwt'
import { setCookie, readBody, createError, defineEventHandler, getRequestIP } from 'h3'
import { z } from 'zod'
import { securityLog } from '~/lib/security-logger'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
  
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    securityLog.validationError(event.path, parsed.error)
    const errMessage = parsed.error.errors.map(e => e.message).join(', ')
    throw createError({ statusCode: 400, message: `Formato dati non valido: ${errMessage}` })
  }
  
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: true }
  })

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    securityLog.authFailure(ip, event.path)
    throw createError({ statusCode: 401, message: 'Invalid credentials' })
  }

  // Prendi il primo team (in futuro potremmo gestire lo switch dei team)
  const primaryMembership = user.memberships[0]
  const teamId = primaryMembership?.teamId
  const role = primaryMembership?.role || 'AGENT'

  if (!teamId && !user.isSuperAdmin) {
    securityLog.authFailure(ip, event.path)
    throw createError({ statusCode: 403, message: 'User does not belong to any team' })
  }

  const token = await signJWT({ 
    userId: user.id, 
    teamId, 
    role,
    isSuperAdmin: user.isSuperAdmin
  })

  const isSecure = process.env.NUXT_PUBLIC_APP_URL?.startsWith('https') || false
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })

  securityLog.authSuccess(ip)
  
  return { 
    success: true, 
    user: { id: user.id, email: user.email, name: user.name, teamId, role } 
  }
})
