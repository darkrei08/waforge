import { defineEventHandler, createError, readBody } from 'h3'
import { prisma } from '../../utils/prisma'
import { SignJWT } from 'jose'
import nodemailer from 'nodemailer'

export default defineEventHandler(async (event) => {
  const authUser = event.context.user
  if (!authUser) throw createError({ statusCode: 401 })

  // Solo OWNER o ADMIN possono invitare utenti nel proprio team
  if (authUser.role !== 'OWNER' && authUser.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Forbidden: Requires ADMIN or OWNER role' })
  }

  const body = await readBody(event)
  const { email, role = 'AGENT' } = body

  if (!email) {
    throw createError({ statusCode: 400, message: 'L\'email è obbligatoria' })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  
  if (existingUser) {
    const existingMembership = await prisma.teamMembership.findUnique({
      where: { userId_teamId: { userId: existingUser.id, teamId: authUser.teamId } }
    })
    
    if (existingMembership) {
      throw createError({ statusCode: 400, message: 'L\'utente è già parte di questo Team' })
    }
  }

  const appSecret = process.env.APP_SECRET || 'fallback-secret-min-32-chars-long!'
  const secretKey = new TextEncoder().encode(appSecret)

  // Generate Invite JWT valid for 48 hours
  const inviteToken = await new SignJWT({ teamId: authUser.teamId, role, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('48h')
    .sign(secretKey)

  // Send Email if SMTP is configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      }
    })

    const appUrl = process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const inviteUrl = `${appUrl}/register?invite=${inviteToken}`

    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'WaForge'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: email,
      subject: `Sei stato invitato a unirti a un team su WaForge`,
      html: `
        <h2>Sei stato invitato su WaForge!</h2>
        <p>Sei stato invitato a unirti al team come <b>${role}</b>.</p>
        <p>Clicca sul link sottostante per accettare l'invito:</p>
        <a href="${inviteUrl}" style="display:inline-block;padding:10px 20px;background:#25D366;color:#fff;text-decoration:none;border-radius:5px;">Accetta Invito</a>
      `
    })
  } else {
    // If SMTP is not configured, we just return the token (useful for local testing)
    return { success: true, message: 'SMTP non configurato. Token generato localmente.', inviteToken }
  }

  return { success: true, message: 'Invito inviato con successo via email.' }
})
