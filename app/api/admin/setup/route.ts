import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { sql, generateSlug } from '@/lib/db'

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
    // Per-bank shareable URL slug
    await sql`ALTER TABLE banks ADD COLUMN IF NOT EXISTS slug VARCHAR(100) UNIQUE`
    // Backfill slugs for existing banks that don't have one
    const { rows: sluglessBanks } = await sql`SELECT id, name FROM banks WHERE slug IS NULL`
    for (const bank of sluglessBanks) {
      const base = generateSlug(bank.name as string)
      let slug = base
      let i = 2
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { rows } = await sql`SELECT 1 FROM banks WHERE slug = ${slug} AND id != ${bank.id as number}`
        if (!rows.length) break
        slug = `${base}-${i++}`
      }
      await sql`UPDATE banks SET slug = ${slug} WHERE id = ${bank.id as number}`
    }
    // Partnership request submissions from /join form
    await sql`
      CREATE TABLE IF NOT EXISTS bank_requests (
        id          SERIAL PRIMARY KEY,
        org_name    TEXT NOT NULL,
        location    TEXT,
        contact     TEXT NOT NULL,
        email       TEXT NOT NULL,
        message     TEXT,
        status      VARCHAR(20) NOT NULL DEFAULT 'pending',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    // Fix FK constraints to include ON DELETE CASCADE
    await sql`ALTER TABLE items DROP CONSTRAINT IF EXISTS items_bank_id_fkey`
    await sql`ALTER TABLE items ADD CONSTRAINT items_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE`
    await sql`ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_bank_id_fkey`
    await sql`ALTER TABLE donations ADD CONSTRAINT donations_bank_id_fkey FOREIGN KEY (bank_id) REFERENCES banks(id) ON DELETE CASCADE`
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
