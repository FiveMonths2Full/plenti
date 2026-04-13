import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getAdminSession, canEditBank } from '@/lib/auth'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = getAdminSession()
  if (!session || !canEditBank(session, params.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { name, detail, size, priority, qty } = await request.json() as {
    name: string; detail: string; size?: string; priority: string; qty: number
  }
  const bankId = parseInt(params.id)
  const { rows } = await sql`
    INSERT INTO items (bank_id, name, detail, size, priority, qty)
    VALUES (${bankId}, ${name}, ${detail || ''}, ${size || null}, ${priority || 'medium'}, ${qty || 0})
    RETURNING id, name, detail, size, priority, qty
  `
  return NextResponse.json(rows[0], { status: 201 })
}
