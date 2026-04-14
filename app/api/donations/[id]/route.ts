import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'
import { sql } from '@/lib/db'
import { sendDonationConfirmed, sendDonationRejected } from '@/lib/email'

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
    SELECT d.bank_id, b.name AS bank_name, don.email AS donor_email, don.name AS donor_name
    FROM donations d
    JOIN banks b ON b.id = d.bank_id
    LEFT JOIN donors don ON don.id = d.donor_id
    WHERE d.id = ${donationId}
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
      const emailItems: Array<{ itemName: string; qtyConfirmed: number }> = []

      for (const ci of body.items) {
        const qtyConfirmed = Math.max(0, ci.qtyConfirmed)
        totalConfirmed += qtyConfirmed

        const { rows: diRows } = await sql`
          SELECT di.qty_pledged, di.item_id, i.name AS item_name
          FROM donation_items di
          LEFT JOIN items i ON i.id = di.item_id
          WHERE di.id = ${ci.donationItemId}
        `
        if (!diRows.length) continue
        const pledged = diRows[0].qty_pledged as number
        const itemId = diRows[0].item_id as number | null
        const itemName = (diRows[0].item_name as string | null) ?? 'Item'
        const fulfillmentRate = pledged > 0 ? Math.round((qtyConfirmed / pledged) * 10000) / 100 : null

        await sql`
          UPDATE donation_items
          SET qty_confirmed = ${qtyConfirmed}, fulfillment_rate = ${fulfillmentRate}
          WHERE id = ${ci.donationItemId}
        `

        // Increment qty_received by the confirmed amount (never touch items.qty)
        if (itemId && qtyConfirmed > 0) {
          await sql`UPDATE items SET qty_received = qty_received + ${qtyConfirmed} WHERE id = ${itemId}`
        }

        if (qtyConfirmed > 0) emailItems.push({ itemName, qtyConfirmed })
      }

      await sql`
        UPDATE donations
        SET status = 'confirmed', confirmed_at = NOW(), total_qty_confirmed = ${totalConfirmed}
        WHERE id = ${donationId}
      `

      await sql`
        UPDATE donors d
        SET donation_count = donation_count + 1
        FROM donations don
        WHERE don.id = ${donationId} AND don.donor_id = d.id
      `

      if (donRows[0].donor_email) {
        await sendDonationConfirmed({
          to: donRows[0].donor_email as string,
          donorName: (donRows[0].donor_name as string) ?? 'Donor',
          bankName: donRows[0].bank_name as string,
          items: emailItems,
        })
      }
    } else if (body.status === 'rejected') {
      // Pledges never touched items.qty, so rejection has no inventory effect
      await sql`
        UPDATE donation_items SET qty_confirmed = 0, fulfillment_rate = 0 WHERE donation_id = ${donationId}
      `
      await sql`
        UPDATE donations SET status = 'rejected', confirmed_at = NOW(), total_qty_confirmed = 0 WHERE id = ${donationId}
      `

      if (donRows[0].donor_email) {
        await sendDonationRejected({
          to: donRows[0].donor_email as string,
          donorName: (donRows[0].donor_name as string) ?? 'Donor',
          bankName: donRows[0].bank_name as string,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
