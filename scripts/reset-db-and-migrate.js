#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

function loadDotEnvIfMissing() {
  // If MONGODB_URI already present, skip
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
    // remove optional surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

;(async () => {
  try {
    loadDotEnvIfMissing()
    const action = process.argv[2] || 'migrate' // migrate | reset | reset-and-migrate
    const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
    const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || (uri && uri.split('/').pop())
    if (!uri || !dbName) {
      console.error('MONGODB_URI or MONGODB_DB not set in environment')
      process.exitCode = 2
      return
    }

    const { MongoClient } = await import('mongodb')
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    await client.connect()
    const db = client.db(dbName)

    console.log('Connected to', dbName)

    if (action === 'reset' || action === 'reset-and-migrate') {
      const colls = ['orders', 'stores', 'products', 'users', 'addresses']
      for (const c of colls) {
        try {
          const coll = db.collection(c)
          const res = await coll.deleteMany({})
          console.log(`Cleared ${c}: deletedCount=${res.deletedCount}`)
        } catch (e) {
          console.warn(`Failed clearing ${c}:`, e?.message || e)
        }
      }
    }

    if (action === 'migrate' || action === 'reset-and-migrate') {
      try {
        const migrator = await import('../lib/migratePublicToMongo.js')
        if (migrator && migrator.ensureMigrated) {
          await migrator.ensureMigrated()
          console.log('Migration completed')
        } else if (migrator && migrator.default && migrator.default.ensureMigrated) {
          await migrator.default.ensureMigrated()
          console.log('Migration completed')
        } else {
          console.error('Migration helper not found')
        }
      } catch (e) {
        console.error('Migration failed:', e?.message || e)
      }
    }

    await client.close()
    console.log('Done')
  } catch (err) {
    console.error('Script error', err)
    process.exitCode = 1
  }
})()
