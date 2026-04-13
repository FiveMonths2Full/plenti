import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { sql } from '@/lib/db'

// Idempotent migration — adds all new tables and columns.
// Run once from the super admin dashboard.
export async function POST() {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // ── Size fields ──────────────────────────────────────────────────────────
    await sql`ALTER TABLE item_catalog ADD COLUMN IF NOT EXISTS size TEXT`
    await sql`ALTER TABLE items ADD COLUMN IF NOT EXISTS size TEXT`

    // ── Donor accounts ───────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS donors (
        id             SERIAL PRIMARY KEY,
        name           TEXT NOT NULL,
        email          TEXT UNIQUE NOT NULL,
        password_hash  TEXT NOT NULL,
        donation_count INTEGER NOT NULL DEFAULT 0,
        created_at     TIMESTAMPTZ DEFAULT NOW()
      )
    `

    // ── Donation records ─────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS donations (
        id                    SERIAL PRIMARY KEY,
        donor_id              INTEGER REFERENCES donors(id) ON DELETE SET NULL,
        bank_id               INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        status                TEXT NOT NULL DEFAULT 'pending',
        donor_note            TEXT,
        referral_source       TEXT,
        item_count            INTEGER NOT NULL DEFAULT 0,
        total_qty_pledged     INTEGER NOT NULL DEFAULT 0,
        total_qty_confirmed   INTEGER,
        created_at            TIMESTAMPTZ DEFAULT NOW(),
        confirmed_at          TIMESTAMPTZ,
        dow                   SMALLINT,
        hour_of_day           SMALLINT
      )
    `

    // ── Donation line items ──────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS donation_items (
        id                    SERIAL PRIMARY KEY,
        donation_id           INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
        item_id               INTEGER,
        item_name             TEXT NOT NULL,
        item_category         TEXT,
        item_size             TEXT,
        priority_at_donation  TEXT,
        qty_pledged           INTEGER NOT NULL DEFAULT 1,
        qty_confirmed         INTEGER,
        fulfillment_rate      NUMERIC(5,2)
      )
    `

    // ── Analytics cache ──────────────────────────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS donation_analytics_cache (
        bank_id                  INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        period                   TEXT NOT NULL,
        total_donations          INTEGER DEFAULT 0,
        confirmed_donations      INTEGER DEFAULT 0,
        rejected_donations       INTEGER DEFAULT 0,
        total_qty_pledged        INTEGER DEFAULT 0,
        total_qty_confirmed      INTEGER DEFAULT 0,
        unique_donors            INTEGER DEFAULT 0,
        repeat_donors            INTEGER DEFAULT 0,
        avg_items_per_donation   NUMERIC(6,2),
        avg_fulfillment_rate     NUMERIC(5,2),
        updated_at               TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (bank_id, period)
      )
    `

    // ── Wishlist items (external / Amazon) ───────────────────────────────────
    await sql`
      CREATE TABLE IF NOT EXISTS wishlist_items (
        id           SERIAL PRIMARY KEY,
        bank_id      INTEGER NOT NULL REFERENCES banks(id) ON DELETE CASCADE,
        name         TEXT NOT NULL,
        description  TEXT,
        size         TEXT,
        external_url TEXT,
        target_qty   INTEGER DEFAULT 1,
        priority     TEXT NOT NULL DEFAULT 'medium',
        created_at   TIMESTAMPTZ DEFAULT NOW()
      )
    `

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Migration failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
