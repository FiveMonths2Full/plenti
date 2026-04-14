import { NextResponse } from 'next/server'
import { getBanks, sql, generateSlug } from '@/lib/db'
import { getAdminSession } from '@/lib/auth'

export async function GET() {
  try {
    const banks = await getBanks()
    return NextResponse.json(banks)
  } catch {
    return NextResponse.json([])
  }
}

export async function POST(request: Request) {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { name, location } = await request.json() as { name: string; location?: string }

  // Generate a unique slug
  const base = generateSlug(name)
  let slug = base
  let i = 2
  while (true) {
    const { rows: existing } = await sql`SELECT 1 FROM banks WHERE slug = ${slug}`
    if (!existing.length) break
    slug = `${base}-${i++}`
  }

  const { rows } = await sql`
    INSERT INTO banks (name, location, slug) VALUES (${name}, ${location || 'Nearby'}, ${slug}) RETURNING id, name, location, slug
  `
  return NextResponse.json({ ...rows[0], items: [] }, { status: 201 })
}
