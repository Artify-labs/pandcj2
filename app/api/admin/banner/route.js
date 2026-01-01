import { getBanner, saveBanner } from '@/lib/banner'

export async function GET() {
  const doc = await getBanner()
  return new Response(JSON.stringify(doc || {}), { status: 200 })
}

export async function POST(req) {
  try {
    const body = await req.json()
    const res = await saveBanner(body)
    if (!res.ok) return new Response(JSON.stringify({ error: 'Failed to save' }), { status: 500 })
    return new Response(JSON.stringify({ success: true, provider: res.provider }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Invalid body' }), { status: 400 })
  }
}
