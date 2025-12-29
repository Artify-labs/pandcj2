import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export async function POST(req) {
  try {
    const body = await req.json()
    const { email, password, role } = body
    if (!email || !password) return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.password) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    if (role && user.role !== role) return NextResponse.json({ error: 'Insufficient role' }, { status: 403 })

    const secret = process.env.JWT_SECRET || 'dev-secret-change-me'
    const token = jwt.sign({ userId: user.id, role: user.role, email: user.email }, secret, { expiresIn: '7d' })

    // Create cookie
    const maxAge = 7 * 24 * 60 * 60 // 7 days
    const isProd = process.env.NODE_ENV === 'production'
    let cookie = `gocart_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
    if (isProd) cookie += '; Secure'

    return NextResponse.json({ ok: true }, { status: 200, headers: { 'Set-Cookie': cookie } })
  } catch (err) {
    console.error('Auth login error', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
