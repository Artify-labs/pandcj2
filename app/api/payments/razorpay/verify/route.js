import crypto from 'crypto'
import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'
import Razorpay from 'razorpay'

const razorpayInstance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })

export async function POST(req) {
  try {
    const body = await req.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payload } = body || {}

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Invalid signature payload' }), { status: 400 })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET
    const expected = crypto.createHmac('sha256', secret).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex')
    const debug = process.env.DEBUG_RAZORPAY === '1'
    if (debug) {
      try {
        console.log('[razorpay:verify] incoming signature:', razorpay_signature)
        console.log('[razorpay:verify] computed signature:', expected)
        console.log('[razorpay:verify] payload (truncated):', JSON.stringify(payload).length > 2000 ? JSON.stringify(payload).slice(0, 2000) + '...[truncated]' : JSON.stringify(payload))
      } catch (e) { /* ignore logging errors */ }
    }
    if (expected !== razorpay_signature) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 400 })
    }

    // signature valid — handle payment and create DB order from payload
    // payload should include: items, total, address, userId, paymentMethod (optional)
    const { items, total, address, userId, localOrderId } = payload || {}
    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(JSON.stringify({ error: 'No items to create order' }), { status: 400 })
    }

    // If localOrderId is provided, check expiry and status
    if (localOrderId) {
      try {
        const local = await prisma.order.findUnique({ where: { id: localOrderId } })
        if (!local) return new Response(JSON.stringify({ error: 'Local order not found' }), { status: 404 })
        // if expired, refund payment immediately
        if (local.expiresAt && new Date(local.expiresAt).getTime() < Date.now()) {
          try {
            const refund = await razorpayInstance.payments.refund(razorpay_payment_id)
            await prisma.order.update({ where: { id: localOrderId }, data: { status: 'EXPIRED', refundId: refund.id } })
            return new Response(JSON.stringify({ ok: false, refunded: true, refundId: refund.id }), { status: 200 })
          } catch (e) {
            console.error('refund failed', e)
            // still mark expired
            await prisma.order.update({ where: { id: localOrderId }, data: { status: 'EXPIRED' } })
            return new Response(JSON.stringify({ ok: false, refunded: false }), { status: 500 })
          }
        }
      } catch (e) {
        console.warn('could not load local order', e.message || e)
      }
    }

    // Ensure user
    const uid = userId || `guest-${randomUUID()}`
    await prisma.user.upsert({ where: { id: uid }, create: { id: uid, name: (address && address.name) || `User ${uid}`, email: (address && address.email) || `${uid}@example.com`, image: '', cart: {} }, update: { name: (address && address.name) || undefined } })

    // create address
    const addrData = address || {}
    const createdAddress = await prisma.address.create({ data: { userId: uid, name: addrData.name || '', email: addrData.email || '', street: addrData.street || '', city: addrData.city || '', state: addrData.state || '', zip: addrData.zip || '', country: addrData.country || '', phone: addrData.phone || '' } })

    // Enrich items: ensure stores and products exist
    const storeIds = Array.from(new Set(items.map(i => i.storeId || 'default-store')))
    for (const sid of storeIds) {
      try {
        await prisma.store.upsert({ where: { id: sid }, create: { id: sid, userId: uid, name: `Store ${sid}`, username: `store-${sid}`, description: '', address: '', status: 'approved', isActive: true, logo: '', email: '', contact: '' }, update: {} })
      } catch (e) {
        console.warn('Could not upsert store', sid, e.message || e)
      }
    }

    for (const it of items) {
      const pid = it.productId || (it.product && it.product.id) || `prod-${randomUUID()}`
      const prodName = (it.product && it.product.name) || it.name || 'Imported product'
      const prodImages = Array.isArray(it.product && it.product.images) ? it.product.images : ((it.product && it.product.images) ? [it.product.images] : [])
      try {
        await prisma.product.upsert({ where: { id: pid }, create: { id: pid, name: prodName, description: (it.product && it.product.description) || '', mrp: Number((it.product && it.product.mrp) || it.price || 0), price: Number((it.product && it.product.price) || it.price || 0), images: prodImages, category: (it.product && it.product.category) || 'uncategorized', storeId: it.storeId || storeIds[0] }, update: {} })
      } catch (e) {
        console.warn('Could not upsert product', pid, e.message || e)
      }
    }

    // create order with orderItems and mark isPaid true
    const orderId = randomUUID()
    const createdOrder = await prisma.order.create({ data: { id: orderId, total: Number(total) || items.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 0)), 0), status: 'ORDER_PLACED', userId: uid, storeId: items[0] ? (items[0].storeId || 'default-store') : 'default-store', addressId: createdAddress.id, isPaid: true, paymentMethod: 'RAZORPAY', paymentProvider: 'RAZORPAY', paymentId: razorpay_payment_id, isCouponUsed: false, coupon: {}, orderItems: { create: items.map(i => ({ productId: i.productId || (i.product && i.product.id) || `prod-${randomUUID()}`, quantity: Number(i.quantity || 1), price: Number(i.price || 0) })) } } })

    // If localOrderId provided, replace the pending order record with this createdOrder or update it
    if (localOrderId) {
      try {
        await prisma.order.delete({ where: { id: localOrderId } })
      } catch (e) { /* ignore */ }
    }

    return new Response(JSON.stringify({ ok: true, id: createdOrder.id }), { status: 200 })
  } catch (err) {
    console.error('Razorpay verify/create order error', err)
    return new Response(JSON.stringify({ error: 'Could not verify payment or create order' }), { status: 500 })
  }
}
