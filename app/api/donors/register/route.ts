import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

export async function POST(request: Request) {
  const { name, email, password, donationId } = await request.json() as {
    name?: string; email?: string; password?: string; donationId?: number
  }

  if (!name?.trim() || !email?.trim() || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 })
  }

  const emailLower = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 })
  }

  try {
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash(password, 10)

    const { rows } = await sql`
      INSERT INTO donors (name, email, password_hash)
      VALUES (${name.trim()}, ${emailLower}, ${hash})
      RETURNING id, name, email
    `
    const donor = rows[0] as { id: number; name: string; email: string }

    // Link any anonymous donation made in this session to the new account
    if (donationId) {
      await sql`
        UPDATE donations SET donor_id = ${donor.id}
        WHERE id = ${donationId} AND donor_id IS NULL
      `
    }

    const isProduction = process.env.NODE_ENV === 'production'
    const response = NextResponse.json({ ok: true, id: donor.id, name: donor.name, email: donor.email })
    response.cookies.set('plenti_donor', JSON.stringify({ id: donor.id, name: donor.name, email: donor.email }), {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: isProduction,
    })
    return response
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : ''
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Registration failed. Try again.' }, { status: 500 })
  }
}
