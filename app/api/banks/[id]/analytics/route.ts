import { NextResponse } from 'next/server'
import { getAdminSession, canEditBank } from '@/lib/auth'
import { sql } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = getAdminSession()
  if (!session || !canEditBank(session, params.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const bankId = parseInt(params.id)
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') ?? '30d'

  // Compute cutoff date in JS — avoids dynamic SQL fragments
  const cutoff = new Date(
    period === '7d'  ? Date.now() - 7  * 24 * 60 * 60 * 1000 :
    period === '30d' ? Date.now() - 30 * 24 * 60 * 60 * 1000 :
    0  // epoch = all time
  ).toISOString()

  try {
    // Summary
    const { rows: summaryRows } = await sql`
      SELECT
        COUNT(*)::int                                                     AS total_donations,
        COUNT(*) FILTER (WHERE status = 'confirmed')::int                AS confirmed_donations,
        COUNT(*) FILTER (WHERE status = 'rejected')::int                 AS rejected_donations,
        COALESCE(SUM(total_qty_pledged), 0)::int                        AS total_qty_pledged,
        COALESCE(SUM(total_qty_confirmed), 0)::int                      AS total_qty_confirmed,
        COUNT(DISTINCT donor_id) FILTER (WHERE donor_id IS NOT NULL)::int AS unique_donors,
        ROUND(AVG(item_count)::numeric, 2)                              AS avg_items_per_donation
      FROM donations
      WHERE bank_id = ${bankId}
        AND created_at >= ${cutoff}
    `
    const summary = summaryRows[0]

    // Repeat donors (donated more than once to this bank)
    const { rows: repeatRows } = await sql`
      SELECT COUNT(DISTINCT donor_id)::int AS repeat_donors
      FROM (
        SELECT donor_id, COUNT(*) AS cnt
        FROM donations
        WHERE bank_id = ${bankId}
          AND donor_id IS NOT NULL
          AND created_at >= ${cutoff}
        GROUP BY donor_id
        HAVING COUNT(*) > 1
      ) sub
    `
    const repeatDonors = repeatRows[0]?.repeat_donors ?? 0

    // Avg fulfillment rate across confirmed donations
    const { rows: frRows } = await sql`
      SELECT ROUND(AVG(fulfillment_rate)::numeric, 2) AS avg_fulfillment_rate
      FROM donation_items di
      JOIN donations d ON d.id = di.donation_id
      WHERE d.bank_id = ${bankId}
        AND d.status = 'confirmed'
        AND di.fulfillment_rate IS NOT NULL
        AND d.created_at >= ${cutoff}
    `
    const avgFulfillmentRate = frRows[0]?.avg_fulfillment_rate ?? null

    // Timeline: donations per day
    const { rows: timelineRows } = await sql`
      SELECT
        DATE_TRUNC('day', created_at)::date::text AS date,
        COUNT(*)::int                              AS donations,
        COALESCE(SUM(total_qty_confirmed), 0)::int AS qty_confirmed
      FROM donations
      WHERE bank_id = ${bankId}
        AND created_at >= ${cutoff}
      GROUP BY DATE_TRUNC('day', created_at)
      ORDER BY date ASC
    `

    // Top items
    const { rows: topItemsRows } = await sql`
      SELECT
        di.item_name                                                    AS name,
        SUM(di.qty_pledged)::int                                       AS qty_pledged,
        COALESCE(SUM(di.qty_confirmed), 0)::int                       AS qty_confirmed,
        ROUND(AVG(di.fulfillment_rate)::numeric, 1)                   AS fulfillment_rate
      FROM donation_items di
      JOIN donations d ON d.id = di.donation_id
      WHERE d.bank_id = ${bankId}
        AND d.created_at >= ${cutoff}
      GROUP BY di.item_name
      ORDER BY qty_pledged DESC
      LIMIT 20
    `

    // Category breakdown
    const { rows: categoryRows } = await sql`
      SELECT
        COALESCE(di.item_category, 'Uncategorized') AS category,
        COALESCE(SUM(di.qty_confirmed), 0)::int      AS qty
      FROM donation_items di
      JOIN donations d ON d.id = di.donation_id
      WHERE d.bank_id = ${bankId}
        AND d.status = 'confirmed'
        AND d.created_at >= ${cutoff}
      GROUP BY di.item_category
      ORDER BY qty DESC
    `

    // Peak hours heatmap (dow 0-6, hour 0-23, count)
    const { rows: peakRows } = await sql`
      SELECT dow, hour_of_day AS hour, COUNT(*)::int AS count
      FROM donations
      WHERE bank_id = ${bankId}
        AND created_at >= ${cutoff}
      GROUP BY dow, hour_of_day
      ORDER BY dow, hour_of_day
    `

    // Days to confirm (bank responsiveness)
    const { rows: responsRows } = await sql`
      SELECT ROUND(AVG(EXTRACT(EPOCH FROM (confirmed_at - created_at)) / 3600)::numeric, 1) AS avg_hours_to_confirm
      FROM donations
      WHERE bank_id = ${bankId}
        AND status = 'confirmed'
        AND confirmed_at IS NOT NULL
        AND created_at >= ${cutoff}
    `

    return NextResponse.json({
      summary: {
        totalDonations:      summary.total_donations,
        confirmedDonations:  summary.confirmed_donations,
        rejectedDonations:   summary.rejected_donations,
        totalQtyPledged:     summary.total_qty_pledged,
        totalQtyConfirmed:   summary.total_qty_confirmed,
        uniqueDonors:        summary.unique_donors,
        repeatDonors,
        avgItemsPerDonation: summary.avg_items_per_donation,
        avgFulfillmentRate,
        avgHoursToConfirm:   responsRows[0]?.avg_hours_to_confirm ?? null,
      },
      timeline:          timelineRows,
      topItems:          topItemsRows,
      categoryBreakdown: categoryRows,
      peakHours:         peakRows,
      donorRetention: {
        unique: summary.unique_donors,
        repeat: repeatDonors,
        rate:   summary.unique_donors > 0
          ? Math.round((repeatDonors / summary.unique_donors) * 100)
          : 0,
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
