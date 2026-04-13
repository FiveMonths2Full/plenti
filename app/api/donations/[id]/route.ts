import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { sql } from '@/lib/db'

interface ConfirmItem {
  donationItemId: number
  qtyConfirmed: number
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = getAdminSession()
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const donationId = parseInt(params.id)
  const body = await request.json() as {
    status: 'confirmed' | 'rejected'
    items?: ConfirmItem[]
  }

  // Verify the donation belongs to a bank this admin can edit
  const { rows: donRows } = await sql`
    SELECT bank_id FROM donations WHERE id = ${donationId}
  `
  if (!donRows.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const bankId = donRows[0].bank_id as number
  if (session.role !== 'super' && session.bankId !== bankId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    if (body.status === 'confirmed' && body.items?.length) {
      let totalConfirmed = 0
      for (const ci of body.items) {
        const qtyConfirmed = Math.max(0, ci.qtyConfirmed)
        totalConfirmed += qtyConfirmed

        // Get pledged qty to calculate adjustment
        const { rows: diRows } = await sql`
          SELECT qty_pledged, item_id FROM donation_items WHERE id = ${ci.donationItemId}
        `
        if (!diRows.length) continue
        const pledged = diRows[0].qty_pledged as number
        const itemId = diRows[0].item_id as number | null
        const fulfillmentRate = pledged > 0 ? Math.round((qtyConfirmed / pledged) * 10000) / 100 : null

        // Update line item
        await sql`
          UPDATE donation_items
          SET qty_confirmed = ${qtyConfirmed}, fulfillment_rate = ${fulfillmentRate}
          WHERE id = ${ci.donationItemId}
        `

        // Adjust item qty: if confirmed < pledged, add back the difference
        if (itemId && qtyConfirmed < pledged) {
          const diff = pledged - qtyConfirmed
          await sql`UPDATE items SET qty = qty + ${diff} WHERE id = ${itemId}`
        }
      }

      // Update donation totals
      await sql`
        UPDATE donations
        SET status = 'confirmed', confirmed_at = NOW(), total_qty_confirmed = ${totalConfirmed}
        WHERE id = ${donationId}
      `

      // Increment donor's donation count if applicable
      await sql`
        UPDATE donors d
        SET donation_count = donation_count + 1
        FROM donations don
        WHERE don.id = ${donationId} AND don.donor_id = d.id
      `
    } else if (body.status === 'rejected') {
      // Return all pledged quantities back to the bank items
      const { rows: diRows } = await sql`
        SELECT item_id, qty_pledged FROM donation_items WHERE donation_id = ${donationId}
      `
      for (const di of diRows) {
        if (di.item_id) {
          await sql`UPDATE items SET qty = qty + ${di.qty_pledged as number} WHERE id = ${di.item_id as number}`
        }
      }
      await sql`
        UPDATE donation_items SET qty_confirmed = 0, fulfillment_rate = 0 WHERE donation_id = ${donationId}
      `
      await sql`
        UPDATE donations SET status = 'rejected', confirmed_at = NOW(), total_qty_confirmed = 0 WHERE id = ${donationId}
      `
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
