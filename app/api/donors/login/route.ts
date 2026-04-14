import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const { allowed } = checkRateLimit(ip, { max: 10, windowMs: 15 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  const { email, password } = await request.json() as {
    email?: string; password?: string
  }

  if (!email?.trim() || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  try {
    const { rows } = await sql`
      SELECT id, name, email, password_hash
      FROM donors
      WHERE email = ${email.trim().toLowerCase()}
      LIMIT 1
    `
    if (!rows.length) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
    }

    const bcrypt = await import('bcryptjs')
    const match = await bcrypt.compare(password, rows[0].password_hash as string)
    if (!match) {
      return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 })
    }

    const donor = { id: rows[0].id as number, name: rows[0].name as string, email: rows[0].email as string }
    const isProduction = process.env.NODE_ENV === 'production'
    const response = NextResponse.json({ ok: true, ...donor })
    response.cookies.set('plenti_donor', JSON.stringify(donor), {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: isProduction,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Login failed. Try again.' }, { status: 500 })
  }
}
