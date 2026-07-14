/**
 * PUT /api/auth/profile — Update user profile (name, password)
 */

import { defineEventHandler, readBody } from 'h3'
import { prisma } from '~/server/utils/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const ProfileSchema = z.object({
  name: z.string().min(2).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = ProfileSchema.safeParse(body)
  
  if (!parsed.success) {
    throw createError({ statusCode: 400, message: 'Dati non validi' })
  }

  const { name, currentPassword, newPassword } = parsed.data
  const userId = event.context.user.userId

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw createError({ statusCode: 404, message: 'Utente non trovato' })

  const updateData: any = {}

  if (name) {
    updateData.name = name
  }

  if (newPassword) {
    if (!currentPassword) {
      throw createError({ statusCode: 400, message: 'Password corrente richiesta' })
    }
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!isValid) {
      throw createError({ statusCode: 401, message: 'Password corrente errata' })
    }
    updateData.passwordHash = await bcrypt.hash(newPassword, 10)
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: { id: true, name: true, email: true }
  })

  return { success: true, user: updatedUser }
})
