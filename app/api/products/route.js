import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    try {
      const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' }, include: { store: true } })
      return new Response(JSON.stringify(products), { status: 200 })
    } catch (dbErr) {
      console.warn('Prisma unavailable for GET /api/products, falling back to files', dbErr.message || dbErr)
    }

    const publicDir = path.join(process.cwd(), 'public')
    const productsFile = path.join(publicDir, 'products.json')
    if (!fs.existsSync(productsFile)) return new Response(JSON.stringify([]), { status: 200 })
    let products = []
    try { products = JSON.parse(fs.readFileSync(productsFile, 'utf8') || '[]') } catch (e) { products = [] }
    return new Response(JSON.stringify(products), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Failed to fetch products' }), { status: 500 })
  }
}
