import { MongoClient } from 'mongodb'
import fs from 'fs/promises'
import fsSync from 'fs'
import path from 'path'

let _migrationPromise = null

export async function ensureMigrated() {
  if (_migrationPromise) return _migrationPromise
  _migrationPromise = (async () => {
    const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
    const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || (uri && uri.split('/').pop())
    if (!uri || !dbName) return

    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    try {
      await client.connect()
      const db = client.db(dbName)

      const meta = db.collection('_meta')
      const flag = await meta.findOne({ key: 'public_migrated' })
      if (flag && flag.value === true) return

      const publicDir = path.join(process.cwd(), 'public')
      // Helper to read JSON file
      async function readJsonIfExists(pf) {
        try {
          if (!fsSync.existsSync(pf)) return []
          const raw = await fs.readFile(pf, 'utf8')
          return JSON.parse(raw || '[]')
        } catch (e) {
          return []
        }
      }

      // Migrate users
      const users = await readJsonIfExists(path.join(publicDir, 'users.json'))
      if (Array.isArray(users) && users.length) {
        const col = db.collection('users')
        const ops = users.map(u => ({ updateOne: { filter: { id: u.id }, update: { $set: u }, upsert: true } }))
        if (ops.length) await col.bulkWrite(ops)
      }

      // Migrate products
      const products = await readJsonIfExists(path.join(publicDir, 'products.json'))
      if (Array.isArray(products) && products.length) {
        const col = db.collection('products')
        const ops = products.map(p => ({ updateOne: { filter: { id: p.id }, update: { $set: p }, upsert: true } }))
        if (ops.length) await col.bulkWrite(ops)
      }

      // Migrate stores
      const stores = await readJsonIfExists(path.join(publicDir, 'stores.json'))
      if (Array.isArray(stores) && stores.length) {
        const col = db.collection('stores')
        const ops = stores.map(s => ({ updateOne: { filter: { id: s.id }, update: { $set: s }, upsert: true } }))
        if (ops.length) await col.bulkWrite(ops)
      }

      // Migrate global orders
      const orders = await readJsonIfExists(path.join(publicDir, 'orders.json'))
      if (Array.isArray(orders) && orders.length) {
        const col = db.collection('orders')
        const ops = orders.map(o => ({ updateOne: { filter: { id: o.id }, update: { $set: o }, upsert: true } }))
        if (ops.length) await col.bulkWrite(ops)
      }

      // Migrate per-store orders in public/stores/*/orders.json
      const storesDir = path.join(publicDir, 'stores')
      if (fsSync.existsSync(storesDir)) {
        const storeIds = await fs.readdir(storesDir)
        for (const sid of storeIds) {
          const sp = path.join(storesDir, sid, 'orders.json')
          try {
            const list = await readJsonIfExists(sp)
            if (Array.isArray(list) && list.length) {
              const col = db.collection('orders')
              const ops = list.map(o => ({ updateOne: { filter: { id: o.id }, update: { $set: o }, upsert: true } }))
              if (ops.length) await col.bulkWrite(ops)
            }
          } catch (e) {
            // ignore per-store migration errors
          }
        }
      }

      // Migrate banner-settings.json (single doc) into 'banners' collection
      try {
        const bannerPath = path.join(publicDir, 'banner-settings.json')
        if (fsSync.existsSync(bannerPath)) {
          const raw = await fs.readFile(bannerPath, 'utf8')
          const banner = raw ? JSON.parse(raw) : null
          if (banner && typeof banner === 'object') {
            const col = db.collection('banners')
            await col.updateOne({ key: 'site' }, { $set: { ...banner, key: 'site' } }, { upsert: true })
          }
        }
      } catch (e) {
        // ignore banner migration errors
      }

      // Migrate newsletters.json (array of subscribers) into 'newsletters' collection
      try {
        const newsletters = await readJsonIfExists(path.join(publicDir, 'newsletters.json'))
        if (Array.isArray(newsletters) && newsletters.length) {
          const col = db.collection('newsletters')
          const ops = newsletters.map(n => ({ updateOne: { filter: { id: n.id }, update: { $set: n }, upsert: true } }))
          if (ops.length) await col.bulkWrite(ops)
        }
      } catch (e) {
        // ignore newsletters migration errors
      }

      // mark migration done
      await meta.updateOne({ key: 'public_migrated' }, { $set: { key: 'public_migrated', value: true, migratedAt: new Date() } }, { upsert: true })

      // rename originals to .bak to disable fallback reads
      async function safeRename(pf) {
        try {
          if (fsSync.existsSync(pf)) await fs.rename(pf, `${pf}.bak`)
        } catch (e) {
          // ignore
        }
      }

      await Promise.all([
        safeRename(path.join(publicDir, 'users.json')),
        safeRename(path.join(publicDir, 'products.json')),
        safeRename(path.join(publicDir, 'stores.json')),
        safeRename(path.join(publicDir, 'orders.json')),
        safeRename(path.join(publicDir, 'banner-settings.json')),
        safeRename(path.join(publicDir, 'newsletters.json'))
      ])

    } catch (err) {
      console.warn('Migration to Mongo failed', err?.message || err)
    } finally {
      try { await client.close() } catch (e) {}
    }
  })()
  return _migrationPromise
}

export default { ensureMigrated }
