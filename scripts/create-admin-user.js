#!/usr/bin/env node
const crypto = require('crypto')
const { MongoClient } = require('mongodb')
const path = require('path')
const fs = require('fs')

// Load environment variables
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  const envPath2 = path.join(process.cwd(), '.env')
  
  let env = {}
  
  for (const filePath of [envPath, envPath2]) {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const [key, ...rest] = trimmed.split('=')
        if (key) {
          env[key] = rest.join('=')
        }
      }
    }
  }
  
  return env
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return { salt, hash }
}

async function main() {
  const env = loadEnv()
  const uri = process.env.MONGODB_URI || env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || env.MONGODB_DB || (uri && uri.split('/').pop())

  if (!uri || !dbName) {
    console.error('❌ MONGODB_URI or MONGODB_DB not found in environment')
    process.exit(1)
  }

  const client = new MongoClient(uri)

  try {
    await client.connect()
    const db = client.db(dbName)

    const email = 'pandcjewellery@gmail.com'
    const password = 'preetb121106'
    const fullName = 'P&C Admin'

    console.log(`Creating admin user: ${email}...`)

    const users = db.collection('users')

    // Check if admin already exists
    const existing = await users.findOne({ email: email.toLowerCase() })
    if (existing) {
      console.log(`✓ Admin user already exists with role: ${existing.role}`)
      if (existing.role !== 'ADMIN') {
        console.log('Updating user role to ADMIN...')
        await users.updateOne(
          { email: email.toLowerCase() },
          { $set: { role: 'ADMIN' } }
        )
        console.log('✓ User role updated to ADMIN')
      }
      return
    }

    // Create new admin user
    const passwordHash = hashPassword(password)
    const adminUser = {
      id: `admin_${Date.now()}`,
      email: email.toLowerCase(),
      password: passwordHash,
      fullName: fullName,
      role: 'ADMIN',
      createdAt: new Date()
    }

    const result = await users.insertOne(adminUser)
    console.log(`✓ Admin user created successfully`)
    console.log(`  ID: ${result.insertedId}`)
    console.log(`  Email: ${email}`)
    console.log(`  Password: ${password}`)
    console.log(`  Role: ADMIN`)

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    process.exit(1)
  } finally {
    await client.close()
  }
}

main()
