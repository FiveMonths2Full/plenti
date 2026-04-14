import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { sql } from '@/lib/db'

// Idempotent — adds credential columns to the banks table if missing.
// Called automatically when super admin logs in.
export async function POST() {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    await sql`ALTER TABLE banks ADD COLUMN IF NOT EXISTS admin_username VARCHAR(100) UNIQUE`
    await sql`ALTER TABLE banks ADD COLUMN IF NOT EXISTS admin_password_hash TEXT`
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
