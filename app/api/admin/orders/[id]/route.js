import fs from 'fs'
import path from 'path'
import prisma from '@/lib/prisma'

export async function PATCH(req, { params }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status } = body || {}

    if (!status) return new Response(JSON.stringify({ error: 'status is required' }), { status: 400 })

    const publicDir = path.join(process.cwd(), 'public')

    // Try to update in DB first
    try {
      const updated = await prisma.order.update({
        where: { id },
        data: { status, updatedAt: new Date() },
        include: { orderItems: true, address: true }
      })

      // Also update fallback files if present to keep parity
      try {
        const ordersFile = path.join(publicDir, 'orders.json')
        if (fs.existsSync(ordersFile)) {
          let orders = []
          try { orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8') || '[]') } catch (e) { orders = [] }
          const idx = orders.findIndex(o => o.id === id)
          if (idx !== -1) {
            orders[idx].status = status
            orders[idx].updatedAt = new Date().toISOString()
            fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2))
          }
        }

        // update per-store files
        const order = updated
        if (Array.isArray(order.orderItems)) {
          const storeIds = Array.from(new Set(order.orderItems.map(i => i.storeId || 'default-store')))
          for (const sid of storeIds) {
            const storeOrdersFile = path.join(publicDir, 'stores', sid, 'orders.json')
            if (!fs.existsSync(storeOrdersFile)) continue
            let storeOrders = []
            try { storeOrders = JSON.parse(fs.readFileSync(storeOrdersFile, 'utf8') || '[]') } catch (e) { storeOrders = [] }
            const si = storeOrders.findIndex(o => o.id === id)
            if (si !== -1) {
              storeOrders[si].status = status
              storeOrders[si].updatedAt = orders[idx] ? orders[idx].updatedAt : new Date().toISOString()
              fs.writeFileSync(storeOrdersFile, JSON.stringify(storeOrders, null, 2))
            }
          }
        }
      } catch (fileSyncErr) {
        console.warn('Failed to sync fallback files after DB update', fileSyncErr.message || fileSyncErr)
      }

      return new Response(JSON.stringify(updated), { status: 200 })
    } catch (dbErr) {
      console.warn('Prisma update failed; falling back to file update', dbErr.message || dbErr)

      // file-based fallback (original behavior)
      const ordersFile = path.join(publicDir, 'orders.json')
      if (!fs.existsSync(ordersFile)) return new Response(JSON.stringify({ error: 'No orders file' }), { status: 404 })

      let orders = []
      try { orders = JSON.parse(fs.readFileSync(ordersFile, 'utf8') || '[]') } catch (e) { orders = [] }

      const idx = orders.findIndex(o => o.id === id)
      if (idx === -1) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })

      orders[idx].status = status
      orders[idx].updatedAt = new Date().toISOString()

      fs.writeFileSync(ordersFile, JSON.stringify(orders, null, 2))

      // Update per-store orders files for any stores involved in this order
      const order = orders[idx]
      if (Array.isArray(order.orderItems)) {
        const storeIds = Array.from(new Set(order.orderItems.map(i => i.storeId || 'default-store')))
        for (const sid of storeIds) {
          const storeOrdersFile = path.join(publicDir, 'stores', sid, 'orders.json')
          if (!fs.existsSync(storeOrdersFile)) continue
          let storeOrders = []
          try { storeOrders = JSON.parse(fs.readFileSync(storeOrdersFile, 'utf8') || '[]') } catch (e) { storeOrders = [] }
          const si = storeOrders.findIndex(o => o.id === id)
          if (si !== -1) {
            storeOrders[si].status = status
            storeOrders[si].updatedAt = orders[idx].updatedAt
            fs.writeFileSync(storeOrdersFile, JSON.stringify(storeOrders, null, 2))
          }
        }
      }

      return new Response(JSON.stringify(orders[idx]), { status: 200 })
    }
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Failed to update order' }), { status: 500 })
  }
}
