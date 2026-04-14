import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { sql } from '@/lib/db'

// ONE-TIME USE: Wipes all test data from production.
// Only callable by super admin. Delete this file after running.
export async function POST(request: Request) {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Require explicit confirmation to prevent accidental calls
  const body = await request.json() as { confirm?: string }
  if (body.confirm !== 'WIPE_TEST_DATA') {
    return NextResponse.json({ error: 'Pass { "confirm": "WIPE_TEST_DATA" } in the body.' }, { status: 400 })
  }

  try {
    // donation_items and wishlist_items cascade from banks/donations
    // donations cascade from banks
    // items cascade from banks
    await sql`DELETE FROM banks`          // cascades: items, donations, donation_items, wishlist_items, analytics_cache
    await sql`DELETE FROM donors`         // removes all donor accounts

    return NextResponse.json({ ok: true, message: 'All banks, items, donations, and donors wiped.' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
