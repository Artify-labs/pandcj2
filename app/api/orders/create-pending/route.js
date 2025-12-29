import { randomUUID } from 'crypto'
import prisma from '@/lib/prisma'

export async function POST(req) {
  try {
    const body = await req.json()
    const { items, total, address, userId } = body || {}
    if (!items || !Array.isArray(items) || items.length === 0) return new Response(JSON.stringify({ error: 'No items' }), { status: 400 })

    // ensure user exists minimally
    const uid = userId || `guest-${randomUUID()}`
    await prisma.user.upsert({ where: { id: uid }, create: { id: uid, name: (address && address.name) || `User ${uid}`, email: (address && address.email) || `${uid}@example.com`, image: '', cart: {} }, update: { name: (address && address.name) || undefined } })

    // create address
    const addrData = address || {}
    const createdAddress = await prisma.address.create({ data: { userId: uid, name: addrData.name || '', email: addrData.email || '', street: addrData.street || '', city: addrData.city || '', state: addrData.state || '', zip: addrData.zip || '', country: addrData.country || '', phone: addrData.phone || '' } })

    // create pending order with minimal items (do not upsert products now)
    const orderId = randomUUID()
    const created = await prisma.order.create({ data: { id: orderId, total: Number(total) || items.reduce((s, i) => s + (Number(i.price || 0) * Number(i.quantity || 0)), 0), status: 'PENDING', userId: uid, storeId: items[0] ? (items[0].storeId || 'default-store') : 'default-store', addressId: createdAddress.id, isPaid: false, paymentMethod: 'RAZORPAY', isCouponUsed: false, coupon: {}, expiresAt: new Date(Date.now() + 10 * 60 * 1000), orderItems: { create: items.map(i => ({ productId: i.productId || (i.product && i.product.id) || `prod-${randomUUID()}`, quantity: Number(i.quantity || 1), price: Number(i.price || 0) })) } } })

    return new Response(JSON.stringify({ localOrderId: created.id }), { status: 200 })
  } catch (err) {
    console.error('create-pending error', err)
    return new Response(JSON.stringify({ error: 'Could not create pending order' }), { status: 500 })
  }
}
