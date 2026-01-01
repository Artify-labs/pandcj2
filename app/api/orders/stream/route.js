import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
const DB_NAME = process.env.MONGODB_DB || process.env.NEXT_PUBLIC_MONGODB_DB || 'gocart'

async function getClient() {
  if (!MONGO_URI) throw new Error('MONGODB_URI not set')
  if (global._mongoClient) return global._mongoClient
  const c = new MongoClient(MONGO_URI, { useUnifiedTopology: true })
  await c.connect()
  global._mongoClient = c
  return c
}

async function computeSummary(coll, storeId) {
  const match = storeId ? { storeId } : {}
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

    const client = await getClient()
    const db = client.db(DB_NAME)
    const coll = db.collection('orders')

    const initial = await computeSummary(coll, storeId)

    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // send initial event
    await writer.ready
    const send = async (obj) => {
      const payload = `event: summary\ndata: ${JSON.stringify(obj)}\n\n`
      await writer.write(new TextEncoder().encode(payload))
    }

    await send({ type: 'initial', data: initial })

    // set up change stream
    const pipeline = []
    const changeStream = coll.watch(pipeline, { fullDocument: 'updateLookup' })

    const onChange = async () => {
      try {
        const latest = await computeSummary(coll, storeId)
        await send({ type: 'update', data: latest })
      } catch (e) {
        // ignore
      }
    }

    // iterate change stream in background
    (async () => {
      try {
        for await (const change of changeStream) {
          await onChange(change)
        }
      } catch (e) {
        // stream closed or error
      } finally {
        try { await writer.close() } catch (e) {}
      }
    })()

    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })

    return new Response(readable, { status: 200, headers })
  } catch (e) {
    return new Response('error', { status: 500 })
  }
}

export default GET
