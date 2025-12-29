import fs from 'fs'
import path from 'path'

export async function DELETE(req, { params }) {
  try {
    const code = params?.code
    if (!code) return new Response(JSON.stringify({ error: 'Missing code' }), { status: 400 })

    const publicDir = path.join(process.cwd(), 'public')
    const file = path.join(publicDir, 'coupons.json')
    if (!fs.existsSync(file)) return new Response(JSON.stringify({ error: 'No coupons' }), { status: 404 })

    let coupons = []
    try { coupons = JSON.parse(fs.readFileSync(file, 'utf8') || '[]') } catch (e) { coupons = [] }

    const filtered = coupons.filter(c => c.code !== code)
    fs.writeFileSync(file, JSON.stringify(filtered, null, 2))
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Could not delete' }), { status: 500 })
  }
}
