import { NextResponse } from 'next/server'
import { getAdminSession, canEditBank } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = getAdminSession()
  if (!session || !canEditBank(session, params.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const bankId = parseInt(params.id)

  try {
    const { rows } = await sql`
      SELECT
        d.id,
        d.status,
        d.claim_code AS "claimCode",
        d.donor_note AS "donorNote",
        d.referral_source AS "referralSource",
        d.item_count AS "itemCount",
        d.total_qty_pledged AS "totalQtyPledged",
        d.total_qty_confirmed AS "totalQtyConfirmed",
        d.created_at AS "createdAt",
        d.confirmed_at AS "confirmedAt",
        d.dow,
        d.hour_of_day AS "hourOfDay",
        CASE WHEN d.donor_id IS NULL THEN NULL ELSE don.name END AS "donorName",
        CASE WHEN d.donor_id IS NULL THEN NULL ELSE don.email END AS "donorEmail",
        don.donation_count AS "donorTotalDonations",
        json_agg(
          json_build_object(
            'id', di.id,
            'itemId', di.item_id,
            'itemName', di.item_name,
            'itemCategory', di.item_category,
            'itemSize', di.item_size,
            'priorityAtDonation', di.priority_at_donation,
            'qtyPledged', di.qty_pledged,
            'qtyConfirmed', di.qty_confirmed,
            'fulfillmentRate', di.fulfillment_rate
          ) ORDER BY di.id
        ) AS items
      FROM donations d
      LEFT JOIN donors don ON don.id = d.donor_id
      LEFT JOIN donation_items di ON di.donation_id = d.id
      WHERE d.bank_id = ${bankId}
      GROUP BY d.id, don.name, don.email, don.donation_count
      ORDER BY d.created_at DESC
      LIMIT 100
    `
    return NextResponse.json(rows)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
