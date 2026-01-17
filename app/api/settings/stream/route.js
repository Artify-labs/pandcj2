import mongodb from '@/lib/mongodb'
import { globalCache, CACHE_KEYS, CACHE_TTL } from '@/lib/cache'

const DB_NAME = process.env.MONGODB_DB || process.env.DB_NAME || process.env.NEXT_PUBLIC_MONGODB_DB || 'pandc'

export async function GET(req) {
  let changeStream = null
  let writer = null
  let heartbeat = null
  
  try {
    const url = new URL(req.url)
    const key = url.searchParams.get('key') || 'banner' // 'banner' or 'pageintro'

    const client = await mongodb.getMongoClient?.() || (await (await import('@/lib/mongodb')).getMongoClient?.())
    const db = client.db(DB_NAME)
    const coll = db.collection('settings')

    // Honda Civic: Check cache first - avoid DB query 95% of the time
    const cacheKey = key === 'banner' ? CACHE_KEYS.BANNER_SETTINGS : CACHE_KEYS.PAGEINTRO_SETTINGS
    let initial = globalCache.get(cacheKey)
    
    // If not in cache, fetch from DB and cache it
    if (!initial) {
      initial = await coll.findOne({ key }, { projection: { _id: 1, value: 1, key: 1 } })
      if (initial) {
        globalCache.set(cacheKey, initial, CACHE_TTL.LONG) // 1 hour
      }
    }

    const { readable, writable } = new TransformStream()
    writer = writable.getWriter()

    const send = async (obj) => {
      try {
        const payload = `event: update\ndata: ${JSON.stringify(obj)}\n\n`
        await writer.write(new TextEncoder().encode(payload))
      } catch (e) {
        console.error('Send error:', e)
      }
    }

    // Send initial event
    await send({ type: 'initial', data: initial?.value || null })

    // Set up change stream - watch for updates/inserts on this key
    changeStream = coll.watch(
      [
        {
          $match: {
            $or: [
              { 'fullDocument.key': key, operationType: 'insert' },
              { 'fullDocument.key': key, operationType: 'update' },
              { 'fullDocument.key': key, operationType: 'replace' }
            ]
          }
        }
      ],
      { fullDocument: 'updateLookup' }
    )

    // Listen for changes and invalidate cache
    ;(async () => {
      try {
        for await (const change of changeStream) {
          if (change.fullDocument && change.fullDocument.key === key) {
            // Honda Civic: Invalidate cache immediately on change
            globalCache.clear(cacheKey)
            await send({ type: 'update', data: change.fullDocument.value })
          }
        }
      } catch (e) {
        if (!e.message.includes('Stream closed')) {
          console.error(`[Settings Stream] Watch error for key ${key}:`, e?.message || e)
        }
      } finally {
        if (heartbeat) clearInterval(heartbeat)
        try { 
          if (changeStream) await changeStream.close()
          if (writer) await writer.close() 
        } catch (e) {}
      }
    })()

    // Heartbeat every 30 seconds to keep connection alive and detect dead clients
    heartbeat = setInterval(async () => {
      try {
        await writer.write(new TextEncoder().encode(': heartbeat\n\n'))
      } catch (e) {
        if (heartbeat) clearInterval(heartbeat)
      }
    }, 30000)

    // Close stream on client disconnect
    req.signal.addEventListener('abort', () => {
      if (heartbeat) clearInterval(heartbeat)
      if (changeStream) changeStream.close().catch(() => {})
      if (writer) writer.close().catch(() => {})
    })

    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    })

    return new Response(readable, { status: 200, headers })
  } catch (e) {
    console.error('Settings stream error:', e)
    try { 
      if (heartbeat) clearInterval(heartbeat)
      if (changeStream) await changeStream.close()
      if (writer) await writer.close() 
    } catch (err) {}
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export default GET
