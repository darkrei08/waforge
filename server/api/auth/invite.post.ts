import bcrypt from 'bcryptjs'
import { prisma } from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const authUser = event.context.user
  if (!authUser) throw createError({ statusCode: 401 })

  // Solo OWNER o ADMIN possono invitare/creare utenti nel proprio team
  if (authUser.role !== 'OWNER' && authUser.role !== 'ADMIN') {
    throw createError({ statusCode: 403, message: 'Forbidden: Requires ADMIN or OWNER role' })
  }

  const body = await readBody(event)
  const { email, password, name, role = 'AGENT' } = body

  if (!email || !password || !name) {
    throw createError({ statusCode: 400, message: 'Email, name and password required' })
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  
  if (existingUser) {
    // Se l'utente esiste già nel DB, verifichiamo se è già nel nostro team
    const existingMembership = await prisma.teamMembership.findUnique({
      where: { 
        userId_teamId: { 
          userId: existingUser.id, 
          teamId: authUser.teamId 
        } 
      }
    })
    
    if (existingMembership) {
      throw createError({ statusCode: 400, message: 'L\'utente è già parte di questo Team' })
    }

    // Aggiungiamo l'utente esistente al nostro team
    await prisma.teamMembership.create({
      data: {
        userId: existingUser.id,
        teamId: authUser.teamId,
        role
      }
    })
    return { success: true, message: 'Utente esistente aggiunto al Team con successo.' }
    
  } else {
    // Creiamo un nuovo utente e lo associamo direttamente al team
    const passwordHash = await bcrypt.hash(password, 10)
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        memberships: {
          create: {
            teamId: authUser.teamId,
            role
          }
        }
      }
    })
    return { 
      success: true, 
      message: 'Nuovo utente creato e aggiunto al Team con successo.', 
      user: { id: newUser.id, email: newUser.email } 
    }
  }
})
