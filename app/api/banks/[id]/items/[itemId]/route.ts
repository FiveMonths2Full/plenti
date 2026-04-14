import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getAdminSession, canEditBank } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = getAdminSession()
  if (!session || !canEditBank(session, params.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await request.json() as Record<string, unknown>
  const itemId = parseInt(params.itemId)
  if (body.priority !== undefined) await sql`UPDATE items SET priority = ${body.priority as string} WHERE id = ${itemId}`
  if (body.name     !== undefined) await sql`UPDATE items SET name = ${body.name as string} WHERE id = ${itemId}`
  if (body.detail   !== undefined) await sql`UPDATE items SET detail = ${body.detail as string} WHERE id = ${itemId}`
  if (body.size     !== undefined) await sql`UPDATE items SET size = ${body.size as string | null} WHERE id = ${itemId}`
  if (body.qty      !== undefined) await sql`UPDATE items SET qty = ${body.qty as number} WHERE id = ${itemId}`
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string; itemId: string } }
) {
  const session = getAdminSession()
  if (!session || !canEditBank(session, params.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // Soft-delete: preserve donation history that references this item
  await sql`UPDATE items SET archived_at = NOW() WHERE id = ${parseInt(params.itemId)}`
  return NextResponse.json({ ok: true })
}
