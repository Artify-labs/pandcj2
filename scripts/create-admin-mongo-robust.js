#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

function loadEnvRobust() {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return {}
  const raw = fs.readFileSync(envPath, 'utf8')
  const out = {}
  // Try simple parse first
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#') || t.indexOf('=') === -1) continue
    const k = t.slice(0, t.indexOf('='))
    const v = t.slice(t.indexOf('=') + 1)
    out[k] = v
  }
  // If MONGODB_URI or MONGODB_DB missing, try robust extraction
  if (!out.MONGODB_URI || !out.MONGODB_DB) {
    const mUriIndex = raw.indexOf('MONGODB_URI=')
    const mDbIndex = raw.indexOf('\nMONGODB_DB=')
    if (mUriIndex !== -1 && mDbIndex !== -1 && mDbIndex > mUriIndex) {
      const uriRaw = raw.slice(mUriIndex + 'MONGODB_URI='.length, mDbIndex)
      // remove newlines and spaces introduced by wrapping
      out.MONGODB_URI = uriRaw.replace(/\s+/g, '')
      const dbLine = raw.slice(mDbIndex + 1).split(/\r?\n/)[0]
      out.MONGODB_DB = dbLine.slice('MONGODB_DB='.length).trim()
    }
  }
  return out
}

async function main() {
  try {
    const env = loadEnvRobust()
    const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI || env.MONGODB_URI
    const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || env.MONGODB_DB || (uri && uri.split('/').pop())
    if (!uri || !dbName) {
      console.error('MONGODB_URI or MONGODB_DB not found')
      process.exitCode = 2
      return
    }
    const { MongoClient } = require('mongodb')
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)

    const email = 'pandcjewellery@gmail.com'
    const password = 'preetb121106'

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
    console.log('Admin upserted:', res.upsertedId ? JSON.stringify(res.upsertedId) : 'updated')
    const found = await users.findOne({ email: adminDoc.email })
    console.log('Found:', !!found)
    await client.close()
  } catch (err) {
    console.error('Error:', err.message || err)
    process.exitCode = 1
  }
}

main()
