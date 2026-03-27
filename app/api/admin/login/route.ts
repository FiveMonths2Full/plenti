import { NextResponse } from 'next/server'

// In-memory rate limiting
const attempts = new Map<string, { count: number; resetAt: number }>()

const MAX_ATTEMPTS = 20
const WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const now = Date.now()

  // Rate limiting
  const entry = attempts.get(ip)
  if (entry) {
    if (now > entry.resetAt) {
      attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    } else if (entry.count >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: 'Too many attempts. Try again later.' },
        { status: 429 }
      )
    } else {
      entry.count++
    }
  } else {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
  }

  const { password, bankId } = await request.json() as { password: string; bankId?: number }

  let role: 'bank' | 'super' = 'super'
  let authenticatedBankId: number | null = null

  if (bankId) {
    // Bank admin login — only check bank password, never fall through to super
    try {
      const { sql } = await import('@vercel/postgres')
      const bcrypt = await import('bcryptjs')
      const { rows } = await sql`SELECT admin_password_hash FROM banks WHERE id = ${bankId}`
      if (!rows.length) {
        return NextResponse.json({ error: 'Bank not found.' }, { status: 401 })
      }
      if (!rows[0].admin_password_hash) {
        return NextResponse.json({ error: 'No password set for this bank yet. Ask your super admin.' }, { status: 401 })
      }
      const match = await bcrypt.compare(password, rows[0].admin_password_hash)
      if (!match) {
        return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
      }
      role = 'bank'
      authenticatedBankId = bankId
    } catch {
      return NextResponse.json({ error: 'Database error. Try again.' }, { status: 500 })
    }
  } else {
    // Super admin login
    const superPassword = process.env.ADMIN_PASSWORD
    if (!superPassword || password !== superPassword) {
      return NextResponse.json({ error: 'Incorrect password.' }, { status: 401 })
    }
    role = 'super'
    authenticatedBankId = null
  }

  // Set HttpOnly cookie
  const sessionData = JSON.stringify({ role, bankId: authenticatedBankId })
  const isProduction = process.env.NODE_ENV === 'production'

  const response = NextResponse.json({ ok: true, role })
  response.cookies.set('plenty_session', sessionData, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: isProduction,
  })

  return response
}
