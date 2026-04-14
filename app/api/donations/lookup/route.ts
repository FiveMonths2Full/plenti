import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'

// Public lookup by claim code — the 6-char code is the secret.
// Used by the intake page so staff can verify a donor's drop-off.
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'code required' }, { status: 400 })

  try {
    const { rows } = await sql`
      SELECT
        d.id,
        d.status,
        d.bank_id,
        d.claim_code,
        CASE WHEN d.donor_id IS NULL THEN NULL ELSE don.name END AS donor_name,
        json_agg(
          json_build_object(
            'id',         di.id,
            'itemName',   di.item_name,
            'itemSize',   di.item_size,
            'qtyPledged', di.qty_pledged
          ) ORDER BY di.id
        ) AS items
      FROM donations d
      LEFT JOIN donors don ON don.id = d.donor_id
      LEFT JOIN donation_items di ON di.donation_id = d.id
      WHERE d.claim_code = ${code}
      GROUP BY d.id, don.name
    `

    if (!rows.length) {
      return NextResponse.json({ error: 'Donation not found' }, { status: 404 })
    }

    const d = rows[0]
    if (d.status !== 'pending') {
      return NextResponse.json(
        { error: 'Already processed', status: d.status },
        { status: 410 }
      )
    }

    return NextResponse.json(d)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Lookup failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
