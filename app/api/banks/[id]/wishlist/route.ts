import { NextResponse } from 'next/server'
import { getAdminSession, canEditBank } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const bankId = parseInt(params.id)
  try {
    const { rows } = await sql`
      SELECT id, bank_id AS "bankId", name, description, size,
             external_url AS "externalUrl", target_qty AS "targetQty",
             priority, created_at AS "createdAt"
      FROM wishlist_items
      WHERE bank_id = ${bankId}
      ORDER BY
        CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END,
        created_at DESC
    `
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = getAdminSession()
  if (!session || !canEditBank(session, params.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const bankId = parseInt(params.id)
  const body = await request.json() as {
    name: string; description?: string; size?: string
    externalUrl?: string; targetQty?: number; priority?: string
  }
  try {
    const { rows } = await sql`
      INSERT INTO wishlist_items (bank_id, name, description, size, external_url, target_qty, priority)
      VALUES (
        ${bankId},
        ${body.name.trim()},
        ${body.description?.trim() || null},
        ${body.size?.trim() || null},
        ${body.externalUrl?.trim() || null},
        ${body.targetQty ?? 1},
        ${body.priority ?? 'medium'}
      )
      RETURNING id, bank_id AS "bankId", name, description, size,
                external_url AS "externalUrl", target_qty AS "targetQty",
                priority, created_at AS "createdAt"
    `
    return NextResponse.json(rows[0], { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
