const fs = require('fs')
const path = require('path')
const { MongoClient } = require('mongodb')

function loadEnv(envPath) {
  try {
    const raw = fs.readFileSync(envPath, 'utf8')
    const lines = raw.split(/\r?\n/)
    for (const line of lines) {
      const s = line.trim()
      if (!s || s.startsWith('#')) continue
      const idx = s.indexOf('=')
      if (idx === -1) continue
      const key = s.slice(0, idx).trim()
      let val = s.slice(idx + 1).trim()
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1)
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1)
      if (!process.env[key]) process.env[key] = val
    }
  } catch (e) {
    // ignore
  }
}

;(async () => {
  const envPath = path.join(process.cwd(), '.env')
  loadEnv(envPath)

  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB

  if (!uri) {
    console.error('MONGODB_URI not found in environment or .env')
    process.exit(1)
  }
  if (!dbName) {
    console.error('MONGODB_DB not set in environment or .env')
    process.exit(1)
  }

  console.log('Connecting to Mongo:', uri.replace(/:\/\/.*?:.*?@/, '://****:****@'))
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  try {
    await client.connect()
    const db = client.db(dbName)
    const collections = ['_meta', 'banners', 'newsletters', 'orders', 'users', 'products', 'stores']
    const out = {}
    for (const name of collections) {
      try {
        const col = db.collection(name)
        const count = await col.countDocuments()
        const sample = await col.find({}).limit(1).toArray()
        out[name] = { count, sample: sample[0] || null }
      } catch (e) {
        out[name] = { error: String(e) }
      }
    }
    console.log(JSON.stringify({ db: dbName, result: out }, null, 2))
  } catch (err) {
    console.error('DB check failed', err && (err.stack || err.message || err))
    process.exit(2)
  } finally {
    try { await client.close() } catch (e) {}
  }
})()
