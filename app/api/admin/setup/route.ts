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
    await sql`DELETE FROM item_catalog WHERE size IS NULL OR TRIM(size) = ''`
    // Donation integrity: track confirmed received qty separately from needed qty
    await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS qty_received INTEGER NOT NULL DEFAULT 0`
    // Claim code for donor drop-off verification
    await sql`ALTER TABLE donations ADD COLUMN IF NOT EXISTS claim_code VARCHAR(8) UNIQUE`
    // Soft-delete: archived items stay in donation history but are hidden from donor view
    await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ`
    // Indexes for high-traffic lookups
    await sql`CREATE INDEX IF NOT EXISTS idx_donations_claim_code ON donations(claim_code)`
    await sql`CREATE INDEX IF NOT EXISTS idx_donations_donor_id ON donations(donor_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_donations_bank_id ON donations(bank_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_donation_items_donation_id ON donation_items(donation_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_items_bank_id ON items(bank_id)`
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
