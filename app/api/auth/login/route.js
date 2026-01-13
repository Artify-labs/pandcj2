import { MongoClient } from 'mongodb'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

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
    const { email, password, role } = body || {}
    if (!email || !password) return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 })

    const { db, client } = await getDb()
    try {
      const users = db.collection('users')
      const user = await users.findOne({ email: String(email).toLowerCase() })
      if (!user) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })

      // expect password stored as { salt, hash }
      if (!verifyPassword(user.password, password)) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 })

      // Check if admin login and user is not admin
      if (role === 'ADMIN' && user.role !== 'ADMIN') {
        return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403 })
      }

      // Create JWT token for both admin and regular users
      const jwtToken = jwt.sign(
        { 
          userId: user.id || user._id, 
          email: user.email,
          role: user.role || 'USER'
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      )

      // Handle admin login
      if (role === 'ADMIN' && user.role === 'ADMIN') {
        // Set admin session cookie
        const cookie = `pandc_admin_token=${jwtToken}; Path=/; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`

        return new Response(
          JSON.stringify({
            ok: true,
            token: jwtToken,
            user: {
              id: user.id || user._id,
              email: user.email,
              fullName: user.fullName || '',
              role: 'ADMIN'
            }
          }),
          {
            status: 200,
            headers: { 'Set-Cookie': cookie }
          }
        )
      }

      // Regular user login
      const cookie = `pandc_user_token=${jwtToken}; Path=/; HttpOnly; Max-Age=${7 * 24 * 60 * 60}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`

      return new Response(
        JSON.stringify({
          ok: true,
          token: jwtToken,
          user: {
            id: user.id || user._id,
            email: user.email,
            fullName: user.fullName || ''
          }
        }),
        {
          status: 200,
          headers: { 'Set-Cookie': cookie }
        }
      )
    } finally {
      try {
        await client.close()
      } catch (e) {}
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Login failed' }), { status: 500 })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ message: 'POST only' }), { status: 405 })
}

