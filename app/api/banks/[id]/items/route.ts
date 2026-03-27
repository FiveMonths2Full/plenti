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
  const { name, detail, priority, qty } = await request.json() as {
    name: string; detail: string; priority: string; qty: number
  }
  const bankId = parseInt(params.id)
  const { rows } = await sql`
    INSERT INTO items (bank_id, name, detail, priority, qty)
    VALUES (${bankId}, ${name}, ${detail || ''}, ${priority || 'medium'}, ${qty || 0})
    RETURNING id, name, detail, priority, qty
  `
  return NextResponse.json(rows[0], { status: 201 })
}
