const fs = require('fs')
const path = require('path')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const publicDir = path.join(process.cwd(), 'public')

function readJSON(p) {
  try {
    if (!fs.existsSync(p)) return null
    const raw = fs.readFileSync(p, 'utf-8')
    return JSON.parse(raw)
  } catch (e) {
    console.error('Failed to read JSON', p, e.message)
    return null
  }
}

async function upsertProduct(prod, storeIdFallback) {
  if (!prod) return null
  const id = prod.id || prod.productId || prod._id || undefined
  const images = prod.images || prod.image || prod.images || []
  try {
    if (id) {
      return await prisma.product.upsert({
        where: { id },
        create: {
          id,
          name: prod.name || 'Unnamed Product',
          description: prod.description || '',
          mrp: Number(prod.mrp || prod.price || 0),
          price: Number(prod.price || prod.mrp || 0),
          images: Array.isArray(images) ? images : [String(images)],
          category: prod.category || 'uncategorized',
          storeId: prod.storeId || storeIdFallback || 'default-store',
        },
        update: {
          name: prod.name || undefined,
          description: prod.description || undefined,
          mrp: Number(prod.mrp || prod.price || 0) || undefined,
          price: Number(prod.price || prod.mrp || 0) || undefined,
          images: Array.isArray(images) ? images : [String(images)],
          category: prod.category || undefined,
          storeId: prod.storeId || storeIdFallback || 'default-store',
        }
      })
    } else {
      // no id: create a new product with prisma default id
      return await prisma.product.create({
        data: {
          name: prod.name || 'Unnamed Product',
          description: prod.description || '',
          mrp: Number(prod.mrp || prod.price || 0),
          price: Number(prod.price || prod.mrp || 0),
          images: Array.isArray(images) ? images : [String(images)],
          category: prod.category || 'uncategorized',
          storeId: prod.storeId || storeIdFallback || 'default-store',
        }
      })
    }
  } catch (e) {
    console.error('Product upsert failed', prod && (prod.id || prod.name), e.message)
    return null
  }
}

async function main() {
  console.log('Starting import from public/*.json to DB...')
  const ordersPath = path.join(publicDir, 'orders.json')
  const productsPath = path.join(publicDir, 'products.json')
  const storesPath = path.join(publicDir, 'stores.json')

  const orders = readJSON(ordersPath) || []
  const products = readJSON(productsPath) || []
  const stores = readJSON(storesPath) || []

  // Index products and stores by id for quick lookup
  const prodById = new Map((products || []).map(p => [p.id, p]))
  const storeById = new Map((stores || []).map(s => [s.id, s]))

  let processed = 0
  for (const o of orders) {
    try {
      // user
      const userId = o.userId || `guest-${Math.floor(Date.now()/1000)}-${Math.random().toString(36).slice(2,6)}`
      const userData = {
        id: userId,
        name: (o.address && o.address.name) || `User ${userId}`,
        email: (o.address && o.address.email) || `${userId}@example.com`,
        image: '',
        cart: {}
      }
      await prisma.user.upsert({
        where: { id: userId },
        create: userData,
        update: {
          name: userData.name,
          email: userData.email
        }
      })

      // address
      const addr = o.address || {}
      const createdAddress = await prisma.address.create({
        data: {
          userId: userId,
          name: addr.name || userData.name,
          email: addr.email || userData.email,
          street: addr.street || '',
          city: addr.city || '',
          state: addr.state || '',
          zip: addr.zip || addr.pincode || '',
          country: addr.country || '',
          phone: addr.phone || ''
        }
      })

      // determine storeId
      const storeId = o.storeId || (Array.isArray(o.orderItems) && o.orderItems[0] && (o.orderItems[0].storeId)) || 'default-store'
      // upsert store (minimal) if not exists
      if (!storeById.has(storeId)) {
        const storeData = stores.find(s => s.id === storeId) || { id: storeId, userId: userId, name: `Store ${storeId}`, username: `store-${storeId}`, description: '', address: '', email: '', contact: '', logo: '' }
        try {
          await prisma.store.upsert({
            where: { id: storeData.id },
            create: {
              id: storeData.id,
              userId: storeData.userId || userId,
              name: storeData.name || `Store ${storeId}`,
              username: storeData.username || `store-${storeId}`,
              description: storeData.description || '',
              address: storeData.address || '',
              status: storeData.status || 'approved',
              isActive: typeof storeData.isActive === 'boolean' ? storeData.isActive : true,
              logo: storeData.logo || '',
              email: storeData.email || '',
              contact: storeData.contact || ''
            },
            update: {
              name: storeData.name || undefined,
              description: storeData.description || undefined
            }
          })
        } catch (e) {
          console.error('Store upsert failed', storeId, e.message)
        }
      }

      // prepare orderItems create data
      const itemsForCreate = []
      for (const it of (o.orderItems || [])) {
        // ensure product exists in DB
        let prodRecord = null
        if (it.product && it.product.id) {
          // try upserting from order item product object
          prodRecord = await upsertProduct(it.product, it.storeId || storeId)
        } else if (it.productId && prodById.has(it.productId)) {
          const p = prodById.get(it.productId)
          prodRecord = await upsertProduct(p, it.storeId || storeId)
        } else {
          // minimal product create
          prodRecord = await upsertProduct({ name: it.name || 'Imported product', price: it.price || 0 }, it.storeId || storeId)
        }
        const productId = prodRecord ? prodRecord.id : (it.productId || `prod-${Math.random().toString(36).slice(2,8)}`)
        itemsForCreate.push({ productId, quantity: Number(it.quantity || 1), price: Number(it.price || 0) })
      }

      // create order with nested orderItems
      const orderCreate = {
        id: o.id || undefined,
        total: Number(o.total || 0),
        status: o.status || 'ORDER_PLACED',
        userId: userId,
        storeId: storeId,
        addressId: createdAddress.id,
        isPaid: !!o.isPaid,
        paymentMethod: o.paymentMethod || 'COD',
        isCouponUsed: !!o.isCouponUsed,
        coupon: o.coupon || {},
        orderItems: {
          create: itemsForCreate
        }
      }

      // create or upsert order
      try {
        if (o.id) {
          const existing = await prisma.order.findUnique({ where: { id: o.id } })
          if (existing) {
            await prisma.order.update({ where: { id: o.id }, data: orderCreate })
          } else {
            await prisma.order.create({ data: orderCreate })
          }
        } else {
          await prisma.order.create({ data: orderCreate })
        }
      } catch (e) {
        console.error('Order create failed for id', o.id, e.message)
      }

      processed++
      if (processed % 10 === 0) console.log(`Processed ${processed} orders...`)
    } catch (err) {
      console.error('Failed to process order', o && o.id, err.message)
    }
  }

  console.log(`Import finished. Processed ${processed} orders.`)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
