import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_EMAIL || process.env.PUBLIC_SUPPORT_EMAIL || 'admin@waforge.com'
  const password = process.env.ADMIN_PASSWORD || 'password123'
  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.upsert({
    where: { email },
    update: { passwordHash, isSuperAdmin: true },
    create: {
      email,
      name: 'Admin',
      passwordHash,
      isSuperAdmin: true,
    },
  })

  // Create a default team if needed
  let team = await prisma.team.findFirst()
  if (!team) {
    team = await prisma.team.create({
      data: {
        name: 'Default Team',
      }
    })
  }

  // Ensure user is in the team
  await prisma.teamMembership.upsert({
    where: {
      userId_teamId: {
        userId: user.id,
        teamId: team.id,
      }
    },
    update: { role: 'OWNER' },
    create: {
      userId: user.id,
      teamId: team.id,
      role: 'OWNER',
    }
  })

  console.log(`Admin user created: ${email} / ${password}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
