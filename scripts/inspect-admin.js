#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function loadEnv() {
  const envPath = path.join(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) return
  const raw = fs.readFileSync(envPath, 'utf8')
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith('#') || t.indexOf('=') === -1) continue
    const k = t.slice(0, t.indexOf('='))
    let v = t.slice(t.indexOf('=') + 1)
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
    if (!process.env[k]) process.env[k] = v
  }
}

async function main() {
  loadEnv()
  const { MongoClient } = require('mongodb')
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || (uri && uri.split('/').pop())
  if (!uri || !dbName) {
    console.error('MONGODB_URI or MONGODB_DB missing in .env')
    process.exit(2)
  }
  const client = new MongoClient(uri)
  try {
    await client.connect()
    const db = client.db(dbName)
    const u = await db.collection('users').findOne({ email: 'pandcjewellery@gmail.com' })
    if (!u) {
      console.log('Admin user not found')
      return
    }
    console.log('Admin user found:')
    console.log(' id:', u.id || u._id)
    console.log(' email:', u.email)
    console.log(' role:', u.role)
    console.log(' password keys:', u.password ? Object.keys(u.password) : typeof u.password)
    if (u.password && u.password.hash) console.log(' password.hash length:', (u.password.hash||'').length)
    if (u.password && u.password.salt) console.log(' password.salt length:', (u.password.salt||'').length)
  } catch (e) {
    console.error('Error:', e.message || e)
  } finally {
    await client.close()
  }
}

main()
