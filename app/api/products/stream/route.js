import mongodb from '@/lib/mongodb'

export async function GET(req) {
  let changeStream = null
  let writer = null
  
  try {
    const url = new URL(req.url)
    const storeId = url.searchParams.get('storeId')

    const db = await (async () => {
      const client = await mongodb.getMongoClient?.() || (await (await import('@/lib/mongodb')).getMongoClient?.())
      return client.db(process.env.MONGODB_DB || process.env.DB_NAME || 'pandc')
    })()

    const coll = db.collection('products')

    const filter = storeId ? { storeId } : {}

    const { readable, writable } = new TransformStream()
    writer = writable.getWriter()

    const send = async (data) => {
      try {
        const payload = `event: update\ndata: ${JSON.stringify(data)}\n\n`
        await writer.write(new TextEncoder().encode(payload))
      } catch (e) {
        console.error('Send error:', e)
      }
    }

    // Stream initial products with pagination to avoid loading all into memory
    const limit = 100
    let skip = 0
    let hasMore = true
    
    while (hasMore) {
      const batch = await coll.find(filter)
        .project({ name: 1, price: 1, id: 1, image: 1, rating: 1, storeId: 1 })  // Only needed fields
        .skip(skip)
        .limit(limit)
        .toArray()
      if (batch.length === 0) {
        hasMore = false
      } else {
        await send({ type: 'initial_batch', products: batch, skip, hasMore: batch.length === limit })
        skip += limit
      }
    }
    await send({ type: 'initial_complete' })

    // Watch for changes
    const pipeline = storeId ? [{ $match: { storeId } }] : []
    changeStream = coll.watch(pipeline, { fullDocument: 'updateLookup' })

    // Track sent documents to avoid duplicate updates
    const recentlyPublished = new Map() // documentId -> timestamp
    const DEDUP_WINDOW = 2000 // 2 second window

    // Background listener
    ;(async () => {
      try {
        for await (const change of changeStream) {
          const docId = change.documentKey._id.toString()
          const now = Date.now()
          
          // Check if we recently sent this document
          const lastSent = recentlyPublished.get(docId)
          if (lastSent && now - lastSent < DEDUP_WINDOW) {
            continue // Skip duplicate update
          }
          
          // Only send the changed document, not all products
          await send({ 
            type: 'product_' + change.operationType, 
            document: change.fullDocument,
            documentKey: change.documentKey
          })
          
          recentlyPublished.set(docId, now)
          
          // Clean up old entries
          for (const [id, timestamp] of recentlyPublished.entries()) {
            if (now - timestamp > DEDUP_WINDOW) recentlyPublished.delete(id)
          }
        }
      } catch (e) {
        if (!e.message.includes('Stream closed')) {
          console.error('Change stream error:', e)
        }
      } finally {
        recentlyPublished.clear()
        try { 
          if (changeStream) await changeStream.close()
          if (writer) await writer.close() 
        } catch (e) {}
      }
    })()

    return new Response(readable, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    })
  } catch (err) {
    console.error('Products stream error:', err)
    try { 
      if (changeStream) await changeStream.close()
      if (writer) await writer.close() 
    } catch (e) {}
    return new Response('error', { status: 500 })
  }
}
