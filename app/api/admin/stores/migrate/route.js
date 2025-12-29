import prisma from '@/lib/prisma'

export async function POST(req) {
  try {
    // Protect this endpoint: require ADMIN_MIGRATE_SECRET header if set, otherwise only allow in non-production
    const secret = process.env.ADMIN_MIGRATE_SECRET
    if (secret) {
      const provided = req.headers.get('x-migrate-secret')
      if (!provided || provided !== secret) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }
    } else if (process.env.NODE_ENV === 'production') {
      return new Response(JSON.stringify({ error: 'Migration endpoint disabled in production' }), { status: 403 })
    }

    const result = await prisma.store.updateMany({
      data: {
        status: 'approved',
        isActive: true,
      },
    })

    return new Response(JSON.stringify({ updatedCount: result.count }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Migration failed' }), { status: 500 })
  }
}
