import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS support_entries (
      id         SERIAL PRIMARY KEY,
      message    TEXT         NOT NULL,
      email      VARCHAR(255),
      source     VARCHAR(50),
      created_at TIMESTAMPTZ  DEFAULT NOW()
    )
  `
}

export async function POST(request: Request) {
  const { message, email, source } = await request.json() as {
    message?: string
    email?: string | null
    source?: string
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 })
  }

  try {
    await ensureTable()
    await sql`
      INSERT INTO support_entries (message, email, source)
      VALUES (${message.trim()}, ${email ?? null}, ${source ?? null})
    `
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('support entry error:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function GET() {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    await ensureTable()
    const { rows } = await sql`
      SELECT id, message, email, source, created_at
      FROM support_entries
      ORDER BY created_at DESC
      LIMIT 100
    `
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}
