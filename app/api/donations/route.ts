import { NextResponse } from 'next/server'
import { getDonorSession } from '@/lib/auth'
import { sql } from '@/lib/db'

interface DonationItem {
  itemId: number
  itemName: string
  itemSize?: string | null
  itemCategory?: string | null
  priorityAtDonation?: string | null
  qty: number
}

export async function POST(request: Request) {
  const body = await request.json() as {
    bankId: number
    items: DonationItem[]
    referralSource?: string
    donorNote?: string
  }

  if (!body.bankId || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'bankId and items are required' }, { status: 400 })
  }

  const donor = getDonorSession()
  const donorId = donor?.id ?? null

  const now = new Date()
  const dow = now.getDay()           // 0 = Sunday
  const hourOfDay = now.getHours()   // 0-23
  const itemCount = body.items.length
  const totalQtyPledged = body.items.reduce((sum, i) => sum + (i.qty || 1), 0)

  try {
    // Create donation record
    const { rows: donRows } = await sql`
      INSERT INTO donations (
        donor_id, bank_id, status, donor_note, referral_source,
        item_count, total_qty_pledged, dow, hour_of_day
      )
      VALUES (
        ${donorId}, ${body.bankId}, 'pending', ${body.donorNote ?? null}, ${body.referralSource ?? 'direct'},
        ${itemCount}, ${totalQtyPledged}, ${dow}, ${hourOfDay}
      )
      RETURNING id
    `
    const donationId = donRows[0].id as number

    // Insert line items and decrement bank qty
    for (const item of body.items) {
      const qty = item.qty || 1
      await sql`
        INSERT INTO donation_items (
          donation_id, item_id, item_name, item_category, item_size, priority_at_donation, qty_pledged
        )
        VALUES (
          ${donationId}, ${item.itemId}, ${item.itemName},
          ${item.itemCategory ?? null}, ${item.itemSize ?? null},
          ${item.priorityAtDonation ?? null}, ${qty}
        )
      `
      // Decrement bank item qty immediately (floor at 0)
      await sql`
        UPDATE items
        SET qty = GREATEST(0, qty - ${qty})
        WHERE id = ${item.itemId}
      `
    }

    return NextResponse.json({ ok: true, donationId }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
