import { MongoClient } from 'mongodb'

async function getDb() {
  const uri = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
  const dbName = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || (uri && uri.split('/').pop())
  if (!uri || !dbName) throw new Error('MONGODB_URI or MONGODB_DB not set')
  const client = new MongoClient(uri)
  await client.connect()
  return { db: client.db(dbName), client }
}

export async function POST(req) {
  try {
    const token = req.cookies.get('pandc_user_token')?.value

    if (token) {
      const { db, client } = await getDb()
      try {
        const sessions = db.collection('user_sessions')
        await sessions.deleteOne({ token })
      } finally {
        try {
          await client.close()
        } catch (e) {}
      }
    }

    // Clear the session cookie
    const cookie = `pandc_user_token=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { 'Set-Cookie': cookie }
      }
    )
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Logout failed' }), { status: 500 })
  }
}

export async function GET() {
  return new Response(JSON.stringify({ message: 'POST only' }), { status: 405 })
}
