const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'pandcjewellery@gmail.com'
  const password = 'preetb121106'
  const hashed = await bcrypt.hash(password, 10)

  const id = 'admin-' + Math.random().toString(36).slice(2, 9)

  try {
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        id,
        name: 'Admin',
        email,
        password: hashed,
        role: 'ADMIN',
        image: ''
      },
      update: {
        password: hashed,
        role: 'ADMIN',
        name: 'Admin'
      }
    })
    console.log('Admin user upserted:', { id: user.id, email: user.email, role: user.role })
  } catch (err) {
    console.error('Failed to upsert admin user', err)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
