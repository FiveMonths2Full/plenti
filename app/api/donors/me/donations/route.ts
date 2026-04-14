import { NextResponse } from 'next/server'
import { getDonorSession } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET() {
  const donor = getDonorSession()
  if (!donor) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { rows } = await sql`
      SELECT
        d.id,
        d.status,
        d.claim_code AS "claimCode",
        d.item_count AS "itemCount",
        d.total_qty_pledged AS "totalQtyPledged",
        d.total_qty_confirmed AS "totalQtyConfirmed",
        d.created_at AS "createdAt",
        d.confirmed_at AS "confirmedAt",
        b.name AS "bankName",
        b.location AS "bankLocation",
        json_agg(
          json_build_object(
            'itemName', di.item_name,
            'itemSize', di.item_size,
            'qtyPledged', di.qty_pledged,
            'qtyConfirmed', di.qty_confirmed
          ) ORDER BY di.id
        ) AS items
      FROM donations d
      JOIN banks b ON b.id = d.bank_id
      LEFT JOIN donation_items di ON di.donation_id = d.id
      WHERE d.donor_id = ${donor.id}
      GROUP BY d.id, b.name, b.location
      ORDER BY d.created_at DESC
      LIMIT 50
    `
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: 'Failed to load donations' }, { status: 500 })
  }
}
