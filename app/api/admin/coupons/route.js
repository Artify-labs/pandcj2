import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const publicDir = path.join(process.cwd(), 'public')
    const file = path.join(publicDir, 'coupons.json')
    if (!fs.existsSync(file)) return new Response(JSON.stringify([]), { status: 200 })
    const data = JSON.parse(fs.readFileSync(file, 'utf8') || '[]')
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify([]), { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { code, description, discount, forNewUser, forMember, isPublic, expiresAt } = body || {}
    if (!code || !discount) return new Response(JSON.stringify({ error: 'code and discount required' }), { status: 400 })

    const publicDir = path.join(process.cwd(), 'public')
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true })
    const file = path.join(publicDir, 'coupons.json')

    let coupons = []
    if (fs.existsSync(file)) {
      try { coupons = JSON.parse(fs.readFileSync(file, 'utf8') || '[]') } catch (e) { coupons = [] }
    }

    if (coupons.find(c => c.code === code)) return new Response(JSON.stringify({ error: 'Coupon code exists' }), { status: 409 })

    const newCoupon = {
      code,
      description: description || '',
      discount: Number(discount) || 0,
      forNewUser: !!forNewUser,
      forMember: !!forMember,
      isPublic: !!isPublic,
      expiresAt: expiresAt || new Date().toISOString(),
      createdAt: new Date().toISOString()
    }

    coupons.push(newCoupon)
    fs.writeFileSync(file, JSON.stringify(coupons, null, 2))
    return new Response(JSON.stringify(newCoupon), { status: 201 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Could not add coupon' }), { status: 500 })
  }
}
