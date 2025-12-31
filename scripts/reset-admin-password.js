#!/usr/bin/env node
const { MongoClient } = require('mongodb')
const crypto = require('crypto')
const fs = require('fs')

// Load .env if dotenv is available (optional)
try { require('dotenv').config() } catch (e) { /* ignore */ }

const argv = process.argv.slice(2)
let [email, password] = argv

if (!email) email = 'pandcjewellery@gmail.com'
const generated = !password
if (!password) {
  // generate a secure random password (16 chars base64)
  password = crypto.randomBytes(12).toString('base64')
}

const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
const dbName = process.env.MONGODB_DB || 'pandc'

if (!uri) {
  console.error('MONGODB_URI not set in environment. Aborting.')
  process.exit(1)
}

async function run() {
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  await client.connect()
  const db = client.db(dbName)
  const users = db.collection('users')

  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  const id = `admin-${email}`

  const res = await users.updateOne(
    { email },
    { $set: { id, email, role: 'ADMIN', password: { salt, hash } } },
    { upsert: true }
  )

  console.log('Admin upsert result:', res.result || res)
  if (generated) {
    console.log('Generated password for', email, '->', password)
  } else {
    console.log('Password set for', email)
  }

  await client.close()
}

run().catch((e) => { console.error(e); process.exit(1) })
