import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const args = process.argv.slice(2)
  
  let email = ''
  let newPassword = ''

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' || args[i] === '-e') {
      email = args[i + 1]
      i++
    } else if (args[i] === '--password' || args[i] === '-p') {
      newPassword = args[i + 1]
      i++
    } else if (!email) {
      email = args[i]
    } else if (!newPassword) {
      newPassword = args[i]
    }
  }

  if (!email || !newPassword) {
    console.log('\n🔐 === WaForge Administrator Password Reset Utility ===\n')
    console.log('Utilizzo:')
    console.log('  bun run admin:reset-password --email admin@example.com --password NuovaPassword123!')
    console.log('  oppure:')
    console.log('  bun run bin/reset-admin-password.ts admin@example.com NuovaPassword123!\n')

    console.log('Elenco utenti amministratori presenti nel database:')
    try {
      const admins = await prisma.user.findMany({
        where: { isSuperAdmin: true },
        select: { id: true, email: true, name: true, isSuperAdmin: true, createdAt: true }
      })
      if (admins.length === 0) {
        console.log('  Nessun superadmin trovato. Mostro tutti gli utenti:')
        const allUsers = await prisma.user.findMany({
          select: { id: true, email: true, name: true, isSuperAdmin: true }
        })
        allUsers.forEach(u => console.log(`  - [${u.email}] (${u.name}) - SuperAdmin: ${u.isSuperAdmin}`))
      } else {
        admins.forEach(u => console.log(`  - [${u.email}] (${u.name}) - SuperAdmin: ${u.isSuperAdmin}`))
      }
    } catch (dbErr: any) {
      console.error('  Errore di connessione al database:', dbErr.message)
      process.exit(1)
    }
    process.exit(0)
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (!existingUser) {
      console.error(`\n❌ Errore: Nessun utente trovato con l'email "${email}".`)
      process.exit(1)
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { passwordHash }
    })

    console.log('\n✅ === PASSWORD RIPRISTINATA CON SUCCESSO ===')
    console.log(`👤 Utente: ${updatedUser.name} (${updatedUser.email})`)
    console.log(`🛡️ SuperAdmin: ${updatedUser.isSuperAdmin ? 'SÌ' : 'NO'}`)
    console.log(`🔑 Nuova Password: ${newPassword}\n`)
  } catch (error: any) {
    console.error('\n❌ Errore durante il ripristino della password:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
