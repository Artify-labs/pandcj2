import prisma from '@/lib/prisma'

export async function PUT(req, context) {
  try {
    // `params` can be async in Next.js app router; await before using
    const params = await context.params
    const id = params?.id
    const body = await req.json()

    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing store id' }), { status: 400 })
    }

    const data = {
      name: body.name ?? undefined,
      username: body.username ?? undefined,
      description: body.description ?? undefined,
      address: body.address ?? undefined,
      contact: body.contact ?? undefined,
      email: body.email ?? undefined,
      logo: body.logo ?? undefined,
      isActive: typeof body.isActive === 'boolean' ? body.isActive : undefined,
      status: body.status ?? undefined,
      updatedAt: new Date(),
    }

    // Remove undefined fields so Prisma doesn't try to set them
    Object.keys(data).forEach((k) => data[k] === undefined && delete data[k])

    const updated = await prisma.store.update({
      where: { id },
      data,
    })

    return new Response(JSON.stringify(updated), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Failed to update store' }), { status: 500 })
  }
}

export async function DELETE(req, context) {
  try {
    const params = await context.params
    const id = params?.id
    if (!id) return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 })

    await prisma.store.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: 'Failed to delete store' }), { status: 500 })
  }
}
