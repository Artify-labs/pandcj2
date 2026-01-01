import mongodb from '@/lib/mongodb'

export async function GET() {
  try {
    const newsletters = await mongodb.newsletter.findMany({})
    return new Response(JSON.stringify(newsletters), { status: 200 })
  } catch (err) {
    console.error('GET /api/admin/newsletters failed:', err)
    return new Response(JSON.stringify({ error: 'Failed to fetch newsletters' }), { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, action } = body

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 })
    }

    let result
    if (action === 'unsubscribe') {
      result = await mongodb.newsletter.unsubscribe(email)
    } else {
      result = await mongodb.newsletter.subscribe(email)
    }

    return new Response(JSON.stringify(result), { status: 200 })
  } catch (err) {
    console.error('POST /api/admin/newsletters failed:', err)
    return new Response(JSON.stringify({ error: 'Failed to manage newsletter' }), { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const url = new URL(req.url)
    const email = url.searchParams.get('email')

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { status: 400 })
    }

    const success = await mongodb.newsletter.delete(email)
    return new Response(JSON.stringify({ success }), { status: 200 })
  } catch (err) {
    console.error('DELETE /api/admin/newsletters failed:', err)
    return new Response(JSON.stringify({ error: 'Failed to delete newsletter entry' }), { status: 500 })
  }
}
