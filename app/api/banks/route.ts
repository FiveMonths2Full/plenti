import { NextResponse } from 'next/server'
import { getBanks, sql } from '@/lib/db'
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
  const { rows } = await sql`
    INSERT INTO banks (name, location) VALUES (${name}, ${location || 'Nearby'}) RETURNING id, name, location
  `
  return NextResponse.json({ ...rows[0], items: [] }, { status: 201 })
}
