import prisma from '@/lib/prisma'
import { ensureMigrated } from '@/lib/migratePublicToMongo'
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const PUBLIC_STORES_PATH = path.join(process.cwd(), 'public', 'stores.json')

async function readPublicStores() {
  try {
    const raw = await readFile(PUBLIC_STORES_PATH, 'utf8')
    return JSON.parse(raw)
  } catch (e) {
    return []
  }
}

async function writePublicStores(stores) {
  await writeFile(PUBLIC_STORES_PATH, JSON.stringify(stores, null, 2), 'utf8')
}

async function ensureUserExists(userId, email, name) {
  try {
    const existing = await prisma.user.findUnique({ where: { id: userId } })
    if (existing) return existing
    // create a minimal placeholder user so foreign key constraint is satisfied
    const created = await prisma.user.create({
      data: {
        id: userId,
        name: name || 'Seller',
        email: email || `${userId}@no-reply.local`,
      },
    })
    return created
  } catch (err) {
    console.warn('Failed to ensure user exists for store.userId', userId, err?.message || err)
    return null
  }
}

function getDefaultUserId() {
  if (process.env.NEXT_PUBLIC_SELLER_CLERK_ID) return process.env.NEXT_PUBLIC_SELLER_CLERK_ID
  if (process.env.ADMIN_IDS) return process.env.ADMIN_IDS.split(',')[0]
  return undefined
}

export async function POST(req) {
  try {
    const body = await req.json()
    const defaultUserId = getDefaultUserId()
    const userId = body?.userId || defaultUserId

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400 })
    }

    const data = {
      userId,
      name: body?.name || '',
      username: body?.username || '',
      description: body?.description || '',
      address: body?.address || '',
      contact: body?.contact || '',
      email: body?.email || '',
      logo: body?.logo || '',
      status: body?.status || 'approved',
      isActive: typeof body?.isActive === 'boolean' ? body.isActive : true,
    }

    const dbUrl = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
    if (dbUrl) {
      // ensure public JSON data is migrated into DB on first DB access
      try { await ensureMigrated() } catch (e) { console.warn('Migration check failed', e?.message || e) }
      try {
        const existing = await prisma.store.findUnique({ where: { userId } })
        if (existing) {
          const updated = await prisma.store.update({ where: { userId }, data })
          return new Response(JSON.stringify(updated), { status: 200 })
        }

        // Ensure the referenced user exists to avoid foreign key violations
        const ensured = await ensureUserExists(userId, data.email, data.name)
        if (!ensured) {
          console.warn('Could not ensure user exists; falling back to public/stores.json')
          throw new Error('Missing user for store')
        }

        const created = await prisma.store.create({ data })
        return new Response(JSON.stringify(created), { status: 201 })
      } catch (dbErr) {
        console.warn('Prisma error while creating/updating store; falling back to public/stores.json', dbErr?.message || dbErr)
      }
    } else {
      console.warn('MONGODB_URI not set; using public/stores.json fallback')
    }

    // fallback
    const stores = await readPublicStores()
    const idx = stores.findIndex((s) => s.userId === userId)
    const now = new Date().toISOString()
    if (idx !== -1) {
      const updated = { ...stores[idx], ...data, updatedAt: now }
      stores[idx] = updated
      await writePublicStores(stores)
      return new Response(JSON.stringify(updated), { status: 200 })
    }

    const id = data.username || `store-${Date.now()}`
    const created = { id, ...data, createdAt: now }
    stores.unshift(created)
    await writePublicStores(stores)
    return new Response(JSON.stringify(created), { status: 201 })
  } catch (err) {
    console.error(err)
    if (err && err.code === 'P2002') {
      return new Response(JSON.stringify({ error: 'Unique constraint failed', meta: err.meta }), { status: 409 })
    }
    return new Response(JSON.stringify({ error: 'Failed to create store' }), { status: 500 })
  }
}

export async function GET(req) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get('userId') || getDefaultUserId()

    const dbUrl = process.env.MONGODB_URI || process.env.NEXT_PUBLIC_MONGODB_URI
    if (dbUrl) {
      try {
        if (userId) {
          const store = await prisma.store.findUnique({ where: { userId } })
          return new Response(JSON.stringify(store || {}), { status: 200 })
        }
        const stores = await prisma.store.findMany({ orderBy: { createdAt: 'desc' } })
        return new Response(JSON.stringify(stores), { status: 200 })
      } catch (dbErr) {
        console.warn('Prisma error when fetching stores; using public/stores.json fallback', dbErr?.message || dbErr)
      }
    } else {
      console.warn('MONGODB_URI not set; using public/stores.json fallback')
    }

    const stores = await readPublicStores()
    if (userId) {
      const store = stores.find((s) => s.userId === userId)
      return new Response(JSON.stringify(store || {}), { status: 200 })
    }
    return new Response(JSON.stringify(stores), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Failed to fetch stores' }), { status: 500 })
  }
}
