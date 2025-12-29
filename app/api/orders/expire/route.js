import prisma from '@/lib/prisma'

export async function POST(req) {
  try {
    const body = await req.json()
    const { localOrderId } = body || {}
    if (!localOrderId) return new Response(JSON.stringify({ error: 'localOrderId required' }), { status: 400 })

    try {
      const ord = await prisma.order.findUnique({ where: { id: localOrderId } })
      if (!ord) return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 })
      if (ord.status === 'EXPIRED') return new Response(JSON.stringify({ ok: true }), { status: 200 })
      await prisma.order.update({ where: { id: localOrderId }, data: { status: 'EXPIRED' } })
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    } catch (e) {
      console.warn('Could not expire order', e.message || e)
      return new Response(JSON.stringify({ error: 'Could not expire order' }), { status: 500 })
    }
  } catch (err) {
    console.error('expire error', err)
    return new Response(JSON.stringify({ error: 'Bad request' }), { status: 400 })
  }
}
