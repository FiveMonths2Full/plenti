import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { rows } = await sql`
    SELECT r.id, r.name, r.detail, r.status, r.created_at,
           b.name as bank_name
    FROM catalog_requests r
    LEFT JOIN banks b ON b.id = r.bank_id
    WHERE r.status = 'pending'
    ORDER BY r.created_at ASC
  `
  return NextResponse.json(rows)
}

export async function POST(request: Request) {
  const session = getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name, detail, bankId } = await request.json() as {
    name: string; detail?: string; bankId?: number
  }
  await sql`
    INSERT INTO catalog_requests (name, detail, bank_id)
    VALUES (${name.trim()}, ${detail?.trim() || ''}, ${bankId || null})
  `
  return NextResponse.json({ ok: true }, { status: 201 })
}
