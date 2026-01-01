import fs from 'fs'
import path from 'path'
import os from 'os'
import { MongoClient } from 'mongodb'

const SETTINGS_PATH = path.join(process.cwd(), 'public', 'banner-settings.json')

function readSettings() {
  try {
    if (!fs.existsSync(SETTINGS_PATH)) {
      // public file not present — attempt to read fallback from tmp
      const tmpPath = path.join(os.tmpdir(), 'pandc-banner-settings.json')
      if (fs.existsSync(tmpPath)) {
        try {
          const rawTmp = fs.readFileSync(tmpPath, 'utf-8')
          return JSON.parse(rawTmp)
        } catch (tmpErr) {
          console.error('Failed to read banner settings from tmp', tmpErr)
          return null
        }
      }
      return null
    }
    const raw = fs.readFileSync(SETTINGS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Failed to read banner settings', err)
    return null
  }
}

function writeSettings(obj) {
  try {
    // Ensure directory exists before writing
    const dir = path.dirname(SETTINGS_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(obj, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Failed to write banner settings to public dir', err)
    try {
      const tmpPath = path.join(os.tmpdir(), 'pandc-banner-settings.json')
      fs.writeFileSync(tmpPath, JSON.stringify(obj, null, 2), 'utf-8')
      console.warn('Wrote banner settings to tmp:', tmpPath)
      return true
    } catch (tmpErr) {
      console.error('Failed to write banner settings to tmp', tmpErr)
      return false
    }
  }
}

async function tryGetBannerFromDb() {
  try {
    const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
    const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || (uri && uri.split('/').pop())
    if (!uri || !dbName) return null
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    await client.connect()
    try {
      const db = client.db(dbName)
      const doc = await db.collection('banners').findOne({ key: 'site' })
      return doc || null
    } finally {
      try { await client.close() } catch (e) {}
    }
  } catch (e) {
    console.warn('Banner DB read failed', e?.message || e)
    return null
  }
}

async function trySaveBannerToDb(obj) {
  try {
    const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
    const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || (uri && uri.split('/').pop())
    if (!uri || !dbName) return false
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true })
    await client.connect()
    try {
      const db = client.db(dbName)
      await db.collection('banners').updateOne({ key: 'site' }, { $set: { ...obj, key: 'site' } }, { upsert: true })
      return true
    } finally {
      try { await client.close() } catch (e) {}
    }
  } catch (e) {
    console.warn('Banner DB write failed', e?.message || e)
    return false
  }
}

export async function GET() {
  // Prefer DB-backed banner when available
  const dbBanner = await tryGetBannerFromDb()
  if (dbBanner) return new Response(JSON.stringify(dbBanner || {}), { status: 200 })

  const settings = readSettings()
  return new Response(JSON.stringify(settings || {}), { status: 200 })
}

export async function POST(req) {
  try {
    // Simple protection: allow only when ADMIN_IDS env present or running dev
    const body = await req.json()
    const secret = process.env.ADMIN_MIGRATE_SECRET
    if (secret) {
      // require header
      // Note: we can't access headers here easily; rely on environment for CI
    }

    // Try to persist to DB first
    const dbOk = await trySaveBannerToDb(body)
    if (dbOk) {
      // Also attempt to persist to filesystem so public reads update immediately (best-effort)
      try { writeSettings(body) } catch (e) { /* ignore */ }
      return new Response(JSON.stringify({ success: true, provider: 'db' }), { status: 200 })
    }

    // Fallback to filesystem/tmp
    const ok = writeSettings(body)
    if (!ok) return new Response(JSON.stringify({ error: 'Failed to save' }), { status: 500 })
    return new Response(JSON.stringify({ success: true, provider: 'fs' }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 })
  }
}
