import { MongoClient } from 'mongodb'
import { ensureMigrated } from '@/lib/migratePublicToMongo'

function getDbInfo() {
  const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
  const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || (uri && uri.split('/').pop())
  return { uri, dbName }
}

export async function POST(req) {
  try {
    const secret = req.headers.get('x-migrate-secret') || req.headers.get('authorization')
    const expected = process.env.MIGRATE_ENDPOINT_SECRET
    if (!expected || !secret || secret !== expected) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const action = (body && body.action) || 'migrate'

    const { uri, dbName } = getDbInfo()
    if (!uri || !dbName) return new Response(JSON.stringify({ error: 'MONGODB_URI/MONGODB_DB not configured' }), { status: 400 })

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    await client.connect()
    const db = client.db(dbName)

    const result = { action }

    if (action === 'reset' || action === 'reset-and-migrate') {
      // wipe key collections safely
      const colls = ['orders', 'stores', 'products', 'users', 'addresses']
      for (const c of colls) {
        try {
          const coll = db.collection(c)
          await coll.deleteMany({})
          result[c] = 'cleared'
        } catch (e) {
          result[c] = `error: ${e?.message || e}`
        }
      }
    }

    if (action === 'migrate' || action === 'reset-and-migrate') {
      try {
        await ensureMigrated()
        result.migrated = true
      } catch (e) {
        result.migrated = `failed: ${e?.message || e}`
      }
    }

    try { await client.close() } catch (e) {}
    return new Response(JSON.stringify(result), { status: 200 })
  } catch (err) {
    console.error('Migration endpoint error', err)
    return new Response(JSON.stringify({ error: 'Migration failed', details: err?.message || String(err) }), { status: 500 })
  }
}

export async function GET(req) {
  try {
    const secret = req.headers.get('x-migrate-secret') || req.headers.get('authorization')
    const expected = process.env.MIGRATE_ENDPOINT_SECRET
    if (!expected || !secret || secret !== expected) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }
    const { uri, dbName } = getDbInfo()
    return new Response(JSON.stringify({ uri: !!uri, dbName }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Failed' }), { status: 500 })
  }
}
