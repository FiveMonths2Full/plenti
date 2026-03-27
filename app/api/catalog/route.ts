import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT id, name, detail, category
      FROM item_catalog
      ORDER BY category NULLS LAST, name
    `
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { name, detail, category } = await request.json() as {
    name: string; detail?: string; category?: string
  }
  try {
    const { rows } = await sql`
      INSERT INTO item_catalog (name, detail, category)
      VALUES (${name.trim()}, ${detail?.trim() || ''}, ${category?.trim() || null})
      RETURNING id, name, detail, category
    `
    return NextResponse.json(rows[0], { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Item already exists in catalog' }, { status: 409 })
  }
}
