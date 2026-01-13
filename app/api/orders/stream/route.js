import { MongoClient } from 'mongodb'

const MONGO_URI = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
const DB_NAME = process.env.MONGODB_DB || process.env.DB_NAME || process.env.NEXT_PUBLIC_MONGODB_DB || 'pandc'

async function getClient() {
  if (!MONGO_URI) throw new Error('MONGODB_URI not set')
  
  const globalForMongo = globalThis;
  if (globalForMongo._mongoClient && globalForMongo._mongoClient.topology) {
    try {
      const pingPromise = globalForMongo._mongoClient.db('admin').command({ ping: 1 })
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Ping timeout')), 5000)
      )
      await Promise.race([pingPromise, timeoutPromise])
      return globalForMongo._mongoClient
    } catch (e) {
      try {
        await globalForMongo._mongoClient.close()
      } catch {}
      globalForMongo._mongoClient = null
    }
  }
  
  const c = new MongoClient(MONGO_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
  })
  await c.connect()
  globalForMongo._mongoClient = c
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
