import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const { allowed } = checkRateLimit(ip, { max: 15, windowMs: 15 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  const body = await request.json() as { username?: string; password?: string }
  const username = body.username?.trim() ?? ''
  const password = body.password ?? ''

  if (!username || !password) {
    return NextResponse.json({ error: 'Username and password are required.' }, { status: 400 })
  }

  let role: 'bank' | 'super' = 'super'
  let authenticatedBankId: number | null = null

  const superUsername = (process.env.ADMIN_USERNAME || 'admin').toLowerCase()
  const superPassword = process.env.ADMIN_PASSWORD

  if (username.toLowerCase() === superUsername) {
    // ── Super admin ──
    if (!superPassword || password !== superPassword) {
      return NextResponse.json({ error: 'Incorrect credentials.' }, { status: 401 })
    }
    role = 'super'
  } else {
    // ── Bank admin — look up by username ──
    try {
      const bcrypt = await import('bcryptjs')
      const { rows } = await sql`
        SELECT id, admin_password_hash
        FROM banks
        WHERE LOWER(admin_username) = LOWER(${username})
        LIMIT 1
      `
      if (!rows.length) {
        return NextResponse.json({ error: 'Incorrect credentials.' }, { status: 401 })
      }
      if (!rows[0].admin_password_hash) {
        return NextResponse.json({ error: 'No credentials set for this account. Contact your super admin.' }, { status: 401 })
      }
      const match = await bcrypt.compare(password, rows[0].admin_password_hash)
      if (!match) {
        return NextResponse.json({ error: 'Incorrect credentials.' }, { status: 401 })
      }
      role = 'bank'
      authenticatedBankId = rows[0].id
    } catch {
      return NextResponse.json({ error: 'Database error. Try again.' }, { status: 500 })
    }
  }

  const sessionData = JSON.stringify({ role, bankId: authenticatedBankId })
  const isProduction = process.env.NODE_ENV === 'production'
  const redirectTo = role === 'bank' ? '/admin/bank-dashboard' : '/admin/dashboard'

  const response = NextResponse.json({ ok: true, role, redirectTo })
  response.cookies.set('plenti_session', sessionData, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: isProduction,
    maxAge: 60 * 60 * 12, // 12 hours
  })
  return response
}
