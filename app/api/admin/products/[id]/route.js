import fs from 'fs'
import path from 'path'

export async function PATCH(req, { params }) {
  try {
    const { id } = await params || {}
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })

    const publicDir = path.join(process.cwd(), 'public')
    const productsFile = path.join(publicDir, 'products.json')
    if (!fs.existsSync(productsFile)) return new Response(JSON.stringify({ error: 'No products' }), { status: 404 })

    let products = []
    try { products = JSON.parse(fs.readFileSync(productsFile, 'utf8') || '[]') } catch (e) { products = [] }

    const idx = products.findIndex(p => p.id === id)
    if (idx === -1) return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 })

    // toggle inStock
    products[idx].inStock = !products[idx].inStock
    products[idx].updatedAt = new Date().toISOString()

    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2))

    return new Response(JSON.stringify(products[idx]), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Could not update product' }), { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params || {}
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })

    const publicDir = path.join(process.cwd(), 'public')
    const productsFile = path.join(publicDir, 'products.json')
    if (!fs.existsSync(productsFile)) return new Response(JSON.stringify({ error: 'No products' }), { status: 404 })

    let products = []
    try { products = JSON.parse(fs.readFileSync(productsFile, 'utf8') || '[]') } catch (e) { products = [] }

    const exists = products.find(p => p.id === id)
    if (!exists) return new Response(JSON.stringify({ error: 'Product not found' }), { status: 404 })

    products = products.filter(p => p.id !== id)

    fs.writeFileSync(productsFile, JSON.stringify(products, null, 2))

    return new Response(JSON.stringify({ id }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Could not delete product' }), { status: 500 })
  }
}
