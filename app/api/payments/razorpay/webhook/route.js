import crypto from 'crypto'
import prisma from '@/lib/prisma'
import Razorpay from 'razorpay'

const razorpayInstance = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET })

export async function POST(req) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
    const bodyText = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''
    const expected = crypto.createHmac('sha256', secret).update(bodyText).digest('hex')
    const debug = process.env.DEBUG_RAZORPAY === '1'
    if (debug) {
      console.log('[razorpay:webhook] incoming signature:', signature)
      console.log('[razorpay:webhook] computed signature:', expected)
      console.log('[razorpay:webhook] body (truncated):', bodyText.length > 2000 ? bodyText.slice(0, 2000) + '...[truncated]' : bodyText)
    }
    if (secret && signature !== expected) return new Response('invalid signature', { status: 400 })

    const event = JSON.parse(bodyText)
    try {
      if (event.event === 'payment.captured') {
        const payment = event.payload.payment.entity
        const razorpayOrderId = payment.order_id
        const razorpayPaymentId = payment.id
        // find local order by razorpayOrderId
        const local = await prisma.order.findFirst({ where: { razorpayOrderId } })
        if (local) {
          // if expired, refund
          if (local.expiresAt && new Date(local.expiresAt).getTime() < Date.now()) {
            try {
              const refund = await razorpayInstance.payments.refund(razorpayPaymentId)
              await prisma.order.update({ where: { id: local.id }, data: { status: 'EXPIRED', refundId: refund.id } })
            } catch (e) {
              console.warn('webhook refund failed', e.message || e)
              await prisma.order.update({ where: { id: local.id }, data: { status: 'EXPIRED' } })
            }
          } else {
            // idempotent update
            if (!local.isPaid) {
              await prisma.order.update({ where: { id: local.id }, data: { isPaid: true, status: 'ORDER_PLACED', paymentId: razorpayPaymentId, paymentProvider: 'RAZORPAY' } })
            }
          }
        }
      }
      if (event.event === 'payment.failed') {
        const payment = event.payload.payment.entity
        const razorpayOrderId = payment.order_id
        const razorpayPaymentId = payment.id
        const errorCode = payment.error_code || payment.error_code || ''
        const errorDesc = payment.error_description || payment.error_description || ''
        if (debug) console.log('[razorpay:webhook] payment.failed details:', { razorpayOrderId, razorpayPaymentId, errorCode, errorDesc })
        try {
          const local = await prisma.order.findFirst({ where: { razorpayOrderId } })
          if (local) {
            const reason = `${errorCode || ''}${errorCode && errorDesc ? ': ' : ''}${errorDesc || ''}`.trim()
            await prisma.order.update({ where: { id: local.id }, data: { status: 'FAILED', paymentId: razorpayPaymentId, paymentProvider: 'RAZORPAY', refundId: null, failureReason: reason } })
          }
        } catch (e) {
          console.warn('webhook failed-event processing error', e.message || e)
        }
      }
    } catch (e) {
      console.warn('webhook processing error', e.message || e)
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('webhook error', err)
    return new Response('bad request', { status: 400 })
  }
}
