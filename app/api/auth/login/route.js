import { MongoClient } from 'mongodb'
import { randomUUID } from 'crypto'
import crypto from 'crypto'

async function getDb() {
  const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
  const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || (uri && uri.split('/').pop())
  if (!uri || !dbName) throw new Error('MONGODB_URI or MONGODB_DB not set')
  const client = new MongoClient(uri)
  await client.connect()
  return { db: client.db(dbName), client }
}

function verifyPassword(stored, provided) {
  try {
    if (!stored || !stored.salt || !stored.hash) return false
    const derived = crypto.scryptSync(provided, stored.salt, 64).toString('hex')
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(stored.hash, 'hex'))
  } catch (e) {
    return false
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, password } = body || {}
    if (!email || !password) return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 })

    const { db, client } = await getDb()
    try {
      const users = db.collection('users')
      const user = await users.findOne({ email: String(email).toLowerCase() })
      if (!user) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })

      // expect password stored as { salt, hash }
      if (!verifyPassword(user.password, password)) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })

      // ensure role is ADMIN
      if (!user.role || user.role !== 'ADMIN') {
        return new Response(JSON.stringify({ error: 'Not an admin' }), { status: 403 })
      }

      // create session token and store in admin_sessions
      const token = randomUUID()
      const sessions = db.collection('admin_sessions')
      const now = new Date()
      const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
      await sessions.updateOne({ token }, { $set: { token, userId: user.id || user._id, createdAt: now, expiresAt: expires } }, { upsert: true })

      // set cookie
      const cookie = `pandc_admin_token=${token}; Path=/; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV==='production'?'; Secure':''}`

      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Set-Cookie': cookie } })
    } finally {
      try { await client.close() } catch (e) {}
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Login failed' }), { status: 500 })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ message: 'POST only' }), { status: 405 })
}

