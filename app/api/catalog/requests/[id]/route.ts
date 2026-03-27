import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { action } = await request.json() as { action: 'approve' | 'reject' }
  const id = parseInt(params.id)

  if (action === 'approve') {
    // Fetch the request
    const { rows } = await sql`SELECT name, detail FROM catalog_requests WHERE id = ${id}`
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const { name, detail } = rows[0]
    // Add to catalog (ignore conflict if already exists)
    await sql`
      INSERT INTO item_catalog (name, detail)
      VALUES (${name}, ${detail})
      ON CONFLICT (name) DO NOTHING
    `
    await sql`UPDATE catalog_requests SET status = 'approved' WHERE id = ${id}`
  } else {
    await sql`UPDATE catalog_requests SET status = 'rejected' WHERE id = ${id}`
  }

  return NextResponse.json({ ok: true })
}
