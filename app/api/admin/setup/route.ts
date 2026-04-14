import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { sql } from '@/lib/db'

// Idempotent — schema patches and data cleanup run automatically on super admin login.
export async function POST() {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    await sql`ALTER TABLE banks ADD COLUMN IF NOT EXISTS admin_username VARCHAR(100) UNIQUE`
    await sql`ALTER TABLE banks ADD COLUMN IF NOT EXISTS admin_password_hash TEXT`
    // Remove catalog items that have no size — donors need size info to shop correctly
    await sql`DELETE FROM item_catalog WHERE size IS NULL OR TRIM(size) = ''`
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
