import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
const DB_NAME = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || 'gocart'

async function getClient() {
  if (!MONGO_URI) throw new Error('MONGODB_URI not set')
  if (global._mongoClient) return global._mongoClient
  const c = new MongoClient(MONGO_URI)
  await c.connect()
  global._mongoClient = c
  return c
}

async function computeSummary({ storeId } = {}) {
  const client = await getClient()
  const coll = client.db(DB_NAME).collection('orders')
  const match = {}
  if (storeId) match.storeId = storeId

  const all = await coll.find(match).toArray()
  const cancelled = all.filter(o => o.status && String(o.status).toUpperCase().startsWith('CANCEL'))
  const visible = all.filter(o => !(o.status && String(o.status).toUpperCase().startsWith('CANCEL')))
  const totalOrders = visible.length
  const totalAmount = visible.reduce((s, o) => s + (Number(o.total) || 0), 0)
  return { totalOrders, totalAmount, cancelled: cancelled.length }
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const storeId = url.searchParams.get('storeId') || undefined
    const summary = await computeSummary({ storeId })
    return new Response(JSON.stringify(summary), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 })
  }
}

export default GET
