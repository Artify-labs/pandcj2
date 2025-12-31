#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function loadDotEnvIfMissing() {
  if (process.env.MONGODB_URI && process.env.MONGODB_DB) return
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return
  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

async function main() {
  try {
    loadDotEnvIfMissing()
    const { MongoClient } = require('mongodb')
    const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
    const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || (uri && uri.split('/').pop())
    if (!uri || !dbName) {
      console.error('MONGODB_URI or MONGODB_DB not set')
      process.exitCode = 2
      return
    }

    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)

    const email = 'pandcjewellery@gmail.com'
    const password = 'preetb121106'

    // create salt + scrypt hash
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.scryptSync(password, salt, 64).toString('hex')

    const users = db.collection('users')
    const now = new Date()
    const adminDoc = {
      id: `admin-${email}`,
      email: email.toLowerCase(),
      name: 'Admin',
      role: 'ADMIN',
      password: { salt, hash },
      createdAt: now,
      updatedAt: now
    }

    const res = await users.updateOne({ email: adminDoc.email }, { $set: adminDoc }, { upsert: true })
    console.log('Admin upserted:', res.upsertedId || 'updated')

    await client.close()
  } catch (err) {
    console.error('Error:', err)
    process.exitCode = 1
  }
}

main()
