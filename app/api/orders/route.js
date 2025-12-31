import fs from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'
import { ensureMigrated } from '@/lib/migratePublicToMongo'

export async function POST(req) {
  try {
    const body = await req.json()
    const { items, total, address, paymentMethod, userId } = body || {}

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items in order' }), { status: 400 })
    }

    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })

    // if DB configured, ensure public JSONs have been migrated to DB
    const dbUrl = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
    if (dbUrl) {
      try { await ensureMigrated() } catch (e) { console.warn('Migration check failed', e?.message || e) }
    }

    // read products to enrich items with product snapshot and storeId
    const productsFile = path.join(publicDir, 'products.json')
    let products = []
    if (fs.existsSync(productsFile)) {
      try { products = JSON.parse(fs.readFileSync(productsFile, 'utf8') || '[]') } catch (e) { products = [] }
    }

    const enrichedItems = items.map((it) => {
      const product = products.find(p => p.id === it.productId) || null
      return {
        product: product ? { ...product } : { id: it.productId, name: it.name || 'Unknown', images: it.images || [] },
        quantity: Number(it.quantity) || 1,
        price: Number(it.price) || (product ? product.price : 0),
        storeId: product ? product.storeId || 'default-store' : (it.storeId || 'default-store')
      }
    })

    // Try to persist to DB via Prisma. If Prisma fails after retries, fall back to file-based persistence.
    const maxAttempts = 3
    let lastDbErr = null
    try {
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
      // Ensure user exists (create minimal user if needed)
      const uid = userId || `guest-${randomUUID()}`
      await prisma.user.upsert({
        where: { id: uid },
        create: { id: uid, name: (address && address.name) || `User ${uid}`, email: (address && address.email) || `${uid}@example.com`, image: '', cart: {} },
        update: { name: (address && address.name) || undefined }
      })

      // create address
      const addrData = address || {}
      const createdAddress = await prisma.address.create({
        data: {
          userId: uid,
          name: addrData.name || (addrData.fullName || ''),
          email: addrData.email || '',
          street: addrData.street || addrData.line1 || '',
          city: addrData.city || '',
          state: addrData.state || '',
          zip: addrData.zip || addrData.pincode || '',
          country: addrData.country || '',
          phone: addrData.phone || ''
        }
      })

      // determine storeId (use first item's storeId as order.storeId)
      const storeId = enrichedItems[0] ? (enrichedItems[0].storeId || 'default-store') : 'default-store'
      // ensure stores referenced by the order exist (minimal upsert) to avoid FK violations
      const storeIds = Array.from(new Set(enrichedItems.map(i => i.storeId || storeId)))
      for (const sid of storeIds) {
        try {
          await prisma.store.upsert({
            where: { id: sid },
            create: {
              id: sid,
              userId: uid,
              name: `Store ${sid}`,
              username: `store-${sid}`,
              description: '',
              address: '',
              status: 'approved',
              isActive: true,
              logo: '',
              email: '',
              contact: ''
            },
            update: {}
          })
        } catch (e) {
          // if upsert fails (unique/user FK), ignore and continue — product upserts may still fail and fallback will occur
          console.warn('Could not ensure store exists', sid, e.message || e)
        }
      }

      // ensure products exist (minimal upsert). If product id missing, generate one and persist a minimal product
      for (const it of enrichedItems) {
        let pid = (it.product && it.product.id) || (it.productId) || null
        if (!pid) {
          pid = `prod-${randomUUID()}`
          if (!it.product) it.product = {}
          it.product.id = pid
        }

        const prodName = (it.product && it.product.name) || 'Imported product'
        const prodImages = Array.isArray(it.product && it.product.images) ? it.product.images : ((it.product && it.product.images) ? [it.product.images] : [])

        await prisma.product.upsert({
          where: { id: pid },
          create: {
            id: pid,
            name: prodName,
            description: (it.product && it.product.description) || '',
            mrp: Number((it.product && it.product.mrp) || it.price || 0),
            price: Number((it.product && it.product.price) || it.price || 0),
            images: prodImages,
            category: (it.product && it.product.category) || 'uncategorized',
            storeId: it.storeId || storeId
          },
          update: {}
        })
      }

      const createdOrder = await prisma.order.create({
        data: {
          id: randomUUID(),
          total: Number(total) || enrichedItems.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 0)), 0),
          status: 'ORDER_PLACED',
          userId: uid,
          storeId: storeId,
          addressId: createdAddress.id,
          isPaid: false,
          paymentMethod: paymentMethod || 'COD',
          isCouponUsed: false,
          coupon: {},
          orderItems: {
            create: enrichedItems.map(i => ({ productId: i.product && i.product.id ? i.product.id : (i.productId || `prod-${randomUUID()}`), quantity: Number(i.quantity || 1), price: Number(i.price || 0) }))
          }
        }
      })

          return new Response(JSON.stringify({ id: createdOrder.id }), { status: 201 })
        } catch (e) {
          lastDbErr = e
          // small backoff before retrying
          if (attempt < maxAttempts - 1) await new Promise(r => setTimeout(r, 500 * (attempt + 1)))
          else throw lastDbErr
        }
      }
    } catch (dbErr) {
      console.warn('Prisma unavailable or failed to create order after retries; falling back to file storage')
      console.warn(dbErr && dbErr.stack ? dbErr.stack : dbErr)

      // fallback to file persistence (existing behavior)
      const fallbackStoreId = enrichedItems[0] ? (enrichedItems[0].storeId || 'default-store') : 'default-store'
      const newOrder = {
        id: randomUUID(),
        userId: userId || null,
        storeId: fallbackStoreId,
        orderItems: enrichedItems.map(i => {
          const pid = (i.product && i.product.id) || i.productId || null
          const images = Array.isArray(i.product && i.product.images) ? i.product.images : ((i.product && i.product.images) ? [i.product.images] : [''])
          return {
            productId: pid,
            product: {
              id: pid,
              name: (i.product && i.product.name) || 'Product',
              images
            },
            quantity: Number(i.quantity || 1),
            price: Number(i.price || 0),
            storeId: i.storeId || fallbackStoreId
          }
        }),
        total: Number(total) || enrichedItems.reduce((s, i) => s + (i.price * i.quantity), 0),
        address: address || {},
        paymentMethod: paymentMethod || 'COD',
        status: 'ORDER_PLACED',
        createdAt: new Date().toISOString(),
        offline: true,
        fallbackReason: dbErr && (dbErr.message || String(dbErr))
      }

      // write to global orders file
      const ordersFile = path.join(publicDir, 'orders.json')
      let orders = []
      if (fs.existsSync(ordersFile)) {
        try { orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8') || '[]') } catch (e) { orders = [] }
      }

      orders.push(newOrder)
      fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2))

      // write per-store orders
      const storeGroups = {}
      for (const item of enrichedItems) {
        const sid = item.storeId || 'default-store'
        if (!storeGroups[sid]) storeGroups[sid] = []
        storeGroups[sid].push(item)
      }

      for (const sid of Object.keys(storeGroups)) {
        const storeDir = path.join(publicDir, 'stores', sid)
        if (!fs.existsSync(storeDir)) fs.mkdirSync(storeDir, { recursive: true })
        const storeOrdersFile = path.join(storeDir, 'orders.json')
        let storeOrders = []
        if (fs.existsSync(storeOrdersFile)) {
          try { storeOrders = JSON.parse(fs.readFileSync(storeOrdersFile, 'utf8') || '[]') } catch (e) { storeOrders = [] }
        }
        // Add the order with only items for that store
        const itemsForStore = newOrder.orderItems.filter(i => (i.storeId || 'default-store') === sid)
        const normalizedItemsForStore = itemsForStore.map(i => ({
          productId: i.productId || (i.product && i.product.id) || null,
          product: i.product || { id: i.productId || null, name: 'Product', images: [''] },
          quantity: Number(i.quantity || 1),
          price: Number(i.price || 0),
          storeId: sid
        }))
        const storeTotal = normalizedItemsForStore.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 0)), 0)
        const orderForStore = { ...newOrder, orderItems: normalizedItemsForStore, total: storeTotal }
        storeOrders.push(orderForStore)
        fs.writeFileSync(storeOrdersFile, JSON.stringify(storeOrders, null, 2))
      }

      return new Response(JSON.stringify({ id: newOrder.id }), { status: 201 })
    }
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Could not create order' }), { status: 500 })
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const storeId = url.searchParams.get('storeId')
    const userId = url.searchParams.get('userId')

    // Try DB first
    try {
      const where = {}
      if (storeId) where.storeId = storeId
      if (userId) where.userId = userId

      let orders = await prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { orderItems: { include: { product: true } }, address: true }
      })

      // Defensive: if any orderItems lack the joined `product` (e.g., product was deleted),
      // try to fetch the product by id and attach a minimal object so the UI can map correctly.
      for (const ord of orders) {
        if (Array.isArray(ord.orderItems)) {
          for (const it of ord.orderItems) {
            if (!it.product || !it.product.id) {
              try {
                const prod = await prisma.product.findUnique({ where: { id: it.productId } })
                if (prod) it.product = prod
                else it.product = { id: it.productId, name: (it.product && it.product.name) || 'Product', images: [] }
              } catch (e) {
                it.product = { id: it.productId || null, name: (it.product && it.product.name) || 'Product', images: [] }
              }
            }
          }
        }
      }

      return new Response(JSON.stringify(orders), { status: 200 })
    } catch (dbErr) {
      console.warn('Prisma unavailable for GET /api/orders, falling back to files', dbErr.message || dbErr)
    }

    // Fallback to public files
    const fs = await import('fs')
    const path = await import('path')
    const publicDir = path.join(process.cwd(), 'public')
    const ordersFile = path.join(publicDir, 'orders.json')
    if (!fs.existsSync(ordersFile)) return new Response(JSON.stringify([]), { status: 200 })
    let orders = []
    try { orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8') || '[]') } catch (e) { orders = [] }
    // Normalize orders read from file so UI can rely on product fields
    orders = orders.map(o => {
      if (!Array.isArray(o.orderItems)) return o
      const items = o.orderItems.map(it => {
        const pid = (it.product && it.product.id) || it.productId || null
        const images = Array.isArray(it.product && it.product.images) ? it.product.images : ((it.product && it.product.images) ? [it.product.images] : [''])
        return {
          productId: pid,
          product: {
            id: pid,
            name: (it.product && it.product.name) || (it.name) || 'Product',
            images
          },
          quantity: Number(it.quantity || 1),
          price: Number(it.price || 0),
          storeId: it.storeId || o.storeId || 'default-store'
        }
      })
      return { ...o, orderItems: items }
    })

    let filtered = orders
    if (storeId) filtered = filtered.filter(o => o.storeId === storeId || (o.orderItems && o.orderItems.some(i => (i.storeId || 'default-store') === storeId)))
    if (userId) filtered = filtered.filter(o => o.userId === userId)

    return new Response(JSON.stringify(filtered), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), { status: 500 })
  }
}
