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
  const { name, detail, size, category } = await request.json() as {
    name?: string; detail?: string; size?: string; category?: string
  }
  const id = parseInt(params.id)
  if (name     !== undefined) await sql`UPDATE item_catalog SET name = ${name} WHERE id = ${id}`
  if (detail   !== undefined) await sql`UPDATE item_catalog SET detail = ${detail} WHERE id = ${id}`
  if (size     !== undefined) await sql`UPDATE item_catalog SET size = ${size} WHERE id = ${id}`
  if (category !== undefined) await sql`UPDATE item_catalog SET category = ${category} WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await sql`DELETE FROM item_catalog WHERE id = ${parseInt(params.id)}`
  return NextResponse.json({ ok: true })
}
