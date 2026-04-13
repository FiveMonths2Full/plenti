'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'

interface SessionInfo { role: 'super' | 'bank'; bankId: number | null }

interface AnalyticsData {
  summary: {
    totalDonations: number
    confirmedDonations: number
    rejectedDonations: number
    totalQtyPledged: number
    totalQtyConfirmed: number
    uniqueDonors: number
    repeatDonors: number
    avgItemsPerDonation: number | null
    avgFulfillmentRate: number | null
    avgHoursToConfirm: number | null
  }
  timeline:          Array<{ date: string; donations: number; qty_confirmed: number }>
  topItems:          Array<{ name: string; qty_pledged: number; qty_confirmed: number; fulfillment_rate: number | null }>
  categoryBreakdown: Array<{ category: string; qty: number }>
  peakHours:         Array<{ dow: number; hour: number; count: number }>
  donorRetention: { unique: number; repeat: number; rate: number }
}

type Period = '7d' | '30d' | 'all'

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function AnalyticsPage() {
  const router = useRouter()
  const { banks } = useStore()
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [data,    setData]    = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [period,  setPeriod]  = useState<Period>('30d')
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetch('/api/admin/session', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((d: SessionInfo) => {
        if (d.role === 'super') router.replace('/admin/dashboard')
        else setSession(d)
      })
      .catch(() => router.replace('/admin'))
  }, [router])

  useEffect(() => {
    if (!session?.bankId) return
    setLoading(true)
    setError('')
    fetch(`/api/banks/${session.bankId}/analytics?period=${period}`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then((d: AnalyticsData) => setData(d))
      .catch(() => setError('Failed to load analytics.'))
      .finally(() => setLoading(false))
  }, [session?.bankId, period])

  async function handleExportCsv() {
    if (!session?.bankId) return
    const res = await fetch(`/api/banks/${session.bankId}/donations`, { cache: 'no-store' })
    if (!res.ok) return
    const donations = await res.json() as Array<{
      id: number; status: string; donorName: string | null; donorEmail: string | null
      createdAt: string; confirmedAt: string | null; referralSource: string | null
      totalQtyPledged: number; totalQtyConfirmed: number | null
      items: Array<{ itemName: string; itemSize: string | null; itemCategory: string | null; qtyPledged: number; qtyConfirmed: number | null; fulfillmentRate: number | null }>
    }>

    const rows: string[][] = [
      ['Donation ID', 'Status', 'Donor', 'Email', 'Date', 'Confirmed At', 'Referral', 'Item', 'Size', 'Category', 'Qty Pledged', 'Qty Confirmed', 'Fulfillment %'],
    ]
    for (const d of donations) {
      for (const item of d.items) {
        rows.push([
          String(d.id),
          d.status,
          d.donorName ?? 'Anonymous',
          d.donorEmail ?? '',
          d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '',
          d.confirmedAt ? new Date(d.confirmedAt).toLocaleDateString() : '',
          d.referralSource ?? 'direct',
          item.itemName,
          item.itemSize ?? '',
          item.itemCategory ?? '',
          String(item.qtyPledged),
          item.qtyConfirmed !== null ? String(item.qtyConfirmed) : '',
          item.fulfillmentRate !== null ? String(item.fulfillmentRate) : '',
        ])
      }
    }

    const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const bank = banks.find(b => b.id === session.bankId)
    a.download = `donations-${bank?.name.replace(/\s+/g, '-').toLowerCase() ?? session.bankId}-${period}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const bank = session?.bankId ? banks.find(b => b.id === session.bankId) : null

  if (!session) {
    return (
      <main style={{ maxWidth: 600, margin: '80px auto 0', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#aaa' }}>Loading…</div>
      </main>
    )
  }

  // Build peak heatmap grid: dow 0-6 × hour 0-23
  const peakMap = new Map<string, number>()
  if (data) {
    for (const p of data.peakHours) peakMap.set(`${p.dow}-${p.hour}`, p.count)
  }
  const maxPeak = data ? Math.max(1, ...data.peakHours.map(p => p.count)) : 1

  const totalCatQty = data ? data.categoryBreakdown.reduce((s, c) => s + c.qty, 0) : 0

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 80px', fontFamily: 'inherit' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href="/admin/bank-dashboard" style={{ fontSize: 13, color: '#888', textDecoration: 'underline' }}>← Dashboard</a>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#111', margin: '6px 0 2px' }}>Analytics</h1>
          <div style={{ fontSize: 13, color: '#888' }}>{bank?.name ?? 'Your food bank'}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(['7d', '30d', 'all'] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
              border: `0.5px solid ${period === p ? '#27500A' : '#ddd'}`,
              background: period === p ? '#27500A' : 'transparent',
              color: period === p ? '#fff' : '#888',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              {p === 'all' ? 'All time' : p === '7d' ? 'Last 7 days' : 'Last 30 days'}
            </button>
          ))}
          <button onClick={handleExportCsv} style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: '0.5px solid #C0DD97', background: 'transparent', color: '#3B6D11',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            ↓ Export CSV
          </button>
        </div>
      </div>

      {error && <div style={{ fontSize: 13, color: '#993C1D', marginBottom: 20 }}>{error}</div>}

      {loading ? (
        <div style={{ fontSize: 13, color: '#aaa', padding: '40px 0', textAlign: 'center' }}>Loading analytics…</div>
      ) : !data ? (
        <div style={{ fontSize: 13, color: '#aaa', padding: '40px 0', textAlign: 'center' }}>No data yet. Donations will appear here once the migration has been run and donors begin confirming.</div>
      ) : data.summary.totalDonations === 0 ? (
        <div style={{ background: '#f8f8f6', border: '0.5px solid #e8e8e8', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#555', marginBottom: 6 }}>No donations yet</div>
          <div style={{ fontSize: 13, color: '#aaa' }}>Analytics will populate as donors confirm donations to your food bank.</div>
        </div>
      ) : (
        <>
          {/* ── Summary cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Total donations',   value: data.summary.totalDonations },
              { label: 'Confirmed',          value: data.summary.confirmedDonations },
              { label: 'Fulfillment rate',   value: data.summary.avgFulfillmentRate != null ? `${data.summary.avgFulfillmentRate}%` : '—' },
              { label: 'Unique donors',      value: data.summary.uniqueDonors },
              { label: 'Repeat donors',      value: data.summary.repeatDonors },
              { label: 'Items received',     value: data.summary.totalQtyConfirmed },
              { label: 'Avg basket size',    value: data.summary.avgItemsPerDonation != null ? Number(data.summary.avgItemsPerDonation).toFixed(1) : '—' },
              { label: 'Avg confirm time',   value: data.summary.avgHoursToConfirm != null ? `${data.summary.avgHoursToConfirm}h` : '—' },
            ].map(card => (
              <div key={card.label} style={{
                background: '#f8f8f6', border: '0.5px solid #e8e8e8', borderRadius: 12, padding: '14px 16px',
              }}>
                <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {card.label}
                </div>
                <div style={{ fontSize: 24, fontWeight: 600, color: '#111' }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* ── Donations over time ── */}
          {data.timeline.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <div style={sectionHead}>Donations over time</div>
              <div style={{ background: '#f8f8f6', border: '0.5px solid #e8e8e8', borderRadius: 12, padding: '16px 16px 8px' }}>
                {(() => {
                  const maxDon = Math.max(1, ...data.timeline.map(t => t.donations))
                  return (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 100, overflowX: 'auto' }}>
                      {data.timeline.map(t => (
                        <div key={t.date} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: 28 }}>
                          <div
                            title={`${t.date}: ${t.donations} donations`}
                            style={{
                              width: 20, background: '#27500A', borderRadius: '3px 3px 0 0',
                              height: `${Math.max(3, (t.donations / maxDon) * 84)}px`,
                            }}
                          />
                          <div style={{ fontSize: 9, color: '#bbb', transform: 'rotate(-45deg)', transformOrigin: 'top left', marginTop: 6, whiteSpace: 'nowrap' }}>
                            {t.date.slice(5)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </section>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginBottom: 32 }}>
            {/* ── Top items table ── */}
            {data.topItems.length > 0 && (
              <section>
                <div style={sectionHead}>Top donated items</div>
                <div style={{ background: '#f8f8f6', border: '0.5px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', gap: 8, padding: '8px 14px', fontSize: 11, fontWeight: 500, color: '#aaa', borderBottom: '0.5px solid #e8e8e8' }}>
                    <span style={{ flex: 1 }}>Item</span>
                    <span style={{ width: 55, textAlign: 'right' }}>Pledged</span>
                    <span style={{ width: 55, textAlign: 'right' }}>Recvd</span>
                    <span style={{ width: 45, textAlign: 'right' }}>Rate</span>
                  </div>
                  {data.topItems.map(item => (
                    <div key={item.name} style={{ display: 'flex', gap: 8, padding: '8px 14px', fontSize: 12, borderBottom: '0.5px solid #f0f0f0', alignItems: 'center' }}>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333' }}>{item.name}</span>
                      <span style={{ width: 55, textAlign: 'right', color: '#888' }}>{item.qty_pledged}</span>
                      <span style={{ width: 55, textAlign: 'right', color: '#555' }}>{item.qty_confirmed}</span>
                      <span style={{ width: 45, textAlign: 'right', color: (item.fulfillment_rate ?? 0) >= 80 ? '#3B6D11' : '#9A6B00' }}>
                        {item.fulfillment_rate != null ? `${item.fulfillment_rate}%` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Category breakdown ── */}
            {data.categoryBreakdown.length > 0 && (
              <section>
                <div style={sectionHead}>Category breakdown</div>
                <div style={{ background: '#f8f8f6', border: '0.5px solid #e8e8e8', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.categoryBreakdown.map(cat => (
                    <div key={cat.category}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: '#333' }}>{cat.category}</span>
                        <span style={{ color: '#888' }}>{cat.qty} units</span>
                      </div>
                      <div style={{ height: 6, background: '#e8e8e8', borderRadius: 3 }}>
                        <div style={{
                          height: '100%', borderRadius: 3, background: '#3B6D11',
                          width: `${totalCatQty > 0 ? Math.round((cat.qty / totalCatQty) * 100) : 0}%`,
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginBottom: 32 }}>
            {/* ── Donor retention ── */}
            <section>
              <div style={sectionHead}>Donor retention</div>
              <div style={{ background: '#f8f8f6', border: '0.5px solid #e8e8e8', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 28, fontWeight: 600, color: '#111', marginBottom: 4 }}>
                  {data.donorRetention.rate}%
                </div>
                <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>return rate</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#111' }}>{data.donorRetention.unique}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>unique donors</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: '#3B6D11' }}>{data.donorRetention.repeat}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>returned</div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Peak hours heatmap ── */}
            {data.peakHours.length > 0 && (
              <section>
                <div style={sectionHead}>Peak donation times</div>
                <div style={{ background: '#f8f8f6', border: '0.5px solid #e8e8e8', borderRadius: 12, padding: 14, overflowX: 'auto' }}>
                  <div style={{ display: 'flex', gap: 2 }}>
                    <div style={{ width: 28, flexShrink: 0 }} /> {/* spacer for hour labels */}
                    {DOW_LABELS.map(d => (
                      <div key={d} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#aaa', marginBottom: 4, minWidth: 20 }}>{d}</div>
                    ))}
                  </div>
                  {Array.from({ length: 24 }, (_, hour) => (
                    <div key={hour} style={{ display: 'flex', gap: 2, marginBottom: 1 }}>
                      <div style={{ width: 28, fontSize: 9, color: '#bbb', textAlign: 'right', paddingRight: 4, lineHeight: '14px', flexShrink: 0 }}>
                        {hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`}
                      </div>
                      {Array.from({ length: 7 }, (_, dow) => {
                        const count = peakMap.get(`${dow}-${hour}`) ?? 0
                        const intensity = count / maxPeak
                        return (
                          <div key={dow} title={count > 0 ? `${DOW_LABELS[dow]} ${hour}:00 — ${count}` : undefined} style={{
                            flex: 1, minWidth: 20, height: 14, borderRadius: 2,
                            background: count === 0
                              ? '#ececec'
                              : `rgba(39,80,10,${0.15 + intensity * 0.85})`,
                          }} />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </>
      )}
    </main>
  )
}

const sectionHead: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#aaa', marginBottom: 10,
}
