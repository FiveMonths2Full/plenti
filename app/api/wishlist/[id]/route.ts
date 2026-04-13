import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const itemId = parseInt(params.id)

  // Verify ownership
  const { rows: ownerRows } = await sql`SELECT bank_id FROM wishlist_items WHERE id = ${itemId}`
  if (!ownerRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const bankId = ownerRows[0].bank_id as number
  if (session.role !== 'super' && session.bankId !== bankId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as {
    name?: string; description?: string; size?: string
    externalUrl?: string; targetQty?: number; priority?: string
  }
  try {
    if (body.name !== undefined) await sql`UPDATE wishlist_items SET name = ${body.name.trim()} WHERE id = ${itemId}`
    if (body.description !== undefined) await sql`UPDATE wishlist_items SET description = ${body.description.trim() || null} WHERE id = ${itemId}`
    if (body.size !== undefined) await sql`UPDATE wishlist_items SET size = ${body.size.trim() || null} WHERE id = ${itemId}`
    if (body.externalUrl !== undefined) await sql`UPDATE wishlist_items SET external_url = ${body.externalUrl.trim() || null} WHERE id = ${itemId}`
    if (body.targetQty !== undefined) await sql`UPDATE wishlist_items SET target_qty = ${body.targetQty} WHERE id = ${itemId}`
    if (body.priority !== undefined) await sql`UPDATE wishlist_items SET priority = ${body.priority} WHERE id = ${itemId}`

    const { rows } = await sql`
      SELECT id, bank_id AS "bankId", name, description, size,
             external_url AS "externalUrl", target_qty AS "targetQty",
             priority, created_at AS "createdAt"
      FROM wishlist_items WHERE id = ${itemId}
    `
    return NextResponse.json(rows[0])
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const itemId = parseInt(params.id)

  const { rows: ownerRows } = await sql`SELECT bank_id FROM wishlist_items WHERE id = ${itemId}`
  if (!ownerRows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const bankId = ownerRows[0].bank_id as number
  if (session.role !== 'super' && session.bankId !== bankId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await sql`DELETE FROM wishlist_items WHERE id = ${itemId}`
  return NextResponse.json({ ok: true })
}
