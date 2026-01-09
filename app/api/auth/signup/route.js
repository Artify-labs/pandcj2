import { MongoClient } from 'mongodb'
import crypto from 'crypto'

async function getDb() {
  const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
  const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || (uri && uri.split('/').pop())
  if (!uri || !dbName) throw new Error('MONGODB_URI or MONGODB_DB not set')
  const client = new MongoClient(uri)
  await client.connect()
  return { db: client.db(dbName), client }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.scryptSync(password, salt, 64).toString('hex')
  return { salt, hash }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, password, fullName } = body || {}

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 })
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'Password must be at least 6 characters' }), { status: 400 })
    }

    const { db, client } = await getDb()
    try {
      const users = db.collection('users')
      const existingUser = await users.findOne({ email: String(email).toLowerCase() })

      if (existingUser) {
        return new Response(JSON.stringify({ error: 'User already exists' }), { status: 409 })
      }

      const passwordHash = hashPassword(password)
      const userId = new Date().getTime().toString()

      const newUser = {
        id: userId,
        email: String(email).toLowerCase(),
        password: passwordHash,
        fullName: fullName || '',
        createdAt: new Date(),
        role: 'USER'
      }

      const result = await users.insertOne(newUser)

      // Create session token
      const token = crypto.randomBytes(32).toString('hex')
      const sessions = db.collection('user_sessions')
      const now = new Date()
      const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days

      await sessions.insertOne({
        token,
        userId: userId,
        createdAt: now,
        expiresAt: expires
      })

      // Set session cookie
      const cookie = `pandc_user_token=${token}; Path=/; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`

      return new Response(
        JSON.stringify({
          ok: true,
          user: {
            id: userId,
            email: newUser.email,
            fullName: newUser.fullName
          }
        }),
        {
          status: 201,
          headers: { 'Set-Cookie': cookie }
        }
      )
    } finally {
      try {
        await client.close()
      } catch (e) {}
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Signup failed' }), { status: 500 })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ message: 'POST only' }), { status: 405 })
}
