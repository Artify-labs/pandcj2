import mongodb from '@/lib/mongodb'

// Get single product
export async function GET(req, { params }) {
  try {
    const { id } = await params || {}
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })

    const product = await mongodb.product.findById(id)
    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 })
    }

    return new Response(JSON.stringify(product), { status: 200 })
  } catch (err) {
    console.error('GET /api/products/[id] failed:', err)
    return new Response(JSON.stringify({ error: 'Failed to fetch product' }), { status: 500 })
  }
}
