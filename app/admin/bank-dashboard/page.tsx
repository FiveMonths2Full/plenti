'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { useIsDesktop } from '@/lib/hooks'
import { Item, CatalogItem, WishlistItem } from '@/lib/types'
import { EmptyState, Toast } from '@/components/ui'
import SupportWidget from '@/components/SupportWidget'

interface SessionInfo { role: 'super' | 'bank'; bankId: number | null }

interface DonationLineItem {
  id: number; itemId: number | null; itemName: string; itemCategory: string | null
  itemSize: string | null; priorityAtDonation: string | null
  qtyPledged: number; qtyConfirmed: number | null; fulfillmentRate: number | null
}
interface Donation {
  id: number; status: 'pending' | 'confirmed' | 'rejected'
  claimCode: string | null
  donorName: string | null; donorEmail: string | null; donorTotalDonations: number | null
  donorNote: string | null; referralSource: string | null
  itemCount: number; totalQtyPledged: number; totalQtyConfirmed: number | null
  createdAt: string; confirmedAt: string | null
  items: DonationLineItem[]
}

export default function BankDashboard() {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const { banks, catalog, ready, addItem, updateItem, deleteItem } = useStore()

  const [session,   setSession]   = useState<SessionInfo | null>(null)
  const [toast,     setToast]     = useState({ visible: false, message: '' })

  // Catalog search
  const [catQuery,    setCatQuery]    = useState('')
  const [catDropdown, setCatDropdown] = useState(false)
  const [selectedCat, setSelectedCat] = useState<CatalogItem | null>(null)
  const [niQty,       setNiQty]       = useState('')
  const [niSize,      setNiSize]      = useState('')
  const [niPriority,  setNiPriority]  = useState<Item['priority']>('medium')
  const catRef = useRef<HTMLDivElement>(null)

  // Request flow
  const [showRequest, setShowRequest] = useState(false)
  const [reqName,     setReqName]     = useState('')
  const [reqDetail,   setReqDetail]   = useState('')
  const [reqSending,  setReqSending]  = useState(false)

  // Wishlist section
  const [showWishlist,      setShowWishlist]      = useState(false)
  const [wishlist,          setWishlist]          = useState<WishlistItem[]>([])
  const [wishlistLoading,   setWishlistLoading]   = useState(false)
  const [editingWishId,     setEditingWishId]      = useState<number | null>(null)
  const [wName,             setWName]             = useState('')
  const [wDesc,             setWDesc]             = useState('')
  const [wSize,             setWSize]             = useState('')
  const [wUrl,              setWUrl]              = useState('')
  const [wQty,              setWQty]              = useState('1')
  const [wPriority,         setWPriority]         = useState<Item['priority']>('medium')
  const [showAddWish,       setShowAddWish]       = useState(false)
  const [newWName,          setNewWName]          = useState('')
  const [newWDesc,          setNewWDesc]          = useState('')
  const [newWSize,          setNewWSize]          = useState('')
  const [newWUrl,           setNewWUrl]           = useState('')
  const [newWQty,           setNewWQty]           = useState('1')
  const [newWPriority,      setNewWPriority]      = useState<Item['priority']>('medium')

  // Donations section
  const [showDonations,     setShowDonations]     = useState(false)
  const [donations,         setDonations]         = useState<Donation[]>([])
  const [donationsLoading,  setDonationsLoading]  = useState(false)
  const [confirmingId,      setConfirmingId]       = useState<number | null>(null)
  const [confirmQtys,       setConfirmQtys]        = useState<Record<number, string>>({})

  // Edit item
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [eiName,     setEiName]     = useState('')
  const [eiDetail,   setEiDetail]   = useState('')
  const [eiSize,     setEiSize]     = useState('')
  const [eiQty,      setEiQty]      = useState('')
  const [eiPriority, setEiPriority] = useState<Item['priority']>('medium')

  useEffect(() => {
    fetch('/api/admin/session', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((d: SessionInfo) => {
        if (d.role === 'super') {
          router.replace('/admin/dashboard')
        } else {
          setSession(d)
        }
      })
      .catch(() => router.replace('/admin'))
  }, [router])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const bank = session?.bankId ? banks.find(b => b.id === session.bankId) : null

  useEffect(() => {
    if (showWishlist && bank) loadWishlist()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showWishlist, bank?.id])

  useEffect(() => {
    if (showDonations && bank) loadDonations()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showDonations, bank?.id])

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500)
  }

  const sortedItems = bank
    ? [...bank.items].sort((a, b) =>
        ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    : []

  const catResults = catQuery.trim().length >= 1
    ? catalog.filter(c => c.name.toLowerCase().includes(catQuery.toLowerCase())).slice(0, 8)
    : []

  function handleSelectCatalogItem(item: CatalogItem) {
    setSelectedCat(item)
    setCatQuery(item.name)
    setNiSize(item.size || '')
    setCatDropdown(false)
    setShowRequest(false)
    setReqName(''); setReqDetail('')
  }

  function handleAddItem() {
    if (!bank || !selectedCat) return
    addItem(bank.id, {
      name: selectedCat.name, detail: selectedCat.detail,
      size: niSize.trim() || null,
      qty: parseInt(niQty) || 0, priority: niPriority,
    })
    setCatQuery(''); setSelectedCat(null); setNiQty(''); setNiSize(''); setNiPriority('medium')
    showToast('Item added')
  }

  async function handleSubmitRequest() {
    if (!reqName.trim() || !bank) return
    setReqSending(true)
    try {
      const res = await fetch('/api/catalog/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: reqName.trim(), detail: reqDetail.trim(), bankId: bank.id }),
      })
      if (res.ok) {
        showToast('Request submitted for review')
        setShowRequest(false); setReqName(''); setReqDetail('')
        setCatQuery(''); setSelectedCat(null)
      } else {
        showToast('Error submitting request')
      }
    } finally {
      setReqSending(false)
    }
  }

  function startEditItem(item: Item) {
    setEditingItemId(item.id)
    setEiName(item.name); setEiDetail(item.detail)
    setEiSize(item.size || '')
    setEiQty(String(item.qty)); setEiPriority(item.priority)
  }

  function handleSaveItem() {
    if (!bank || !editingItemId || !eiName.trim()) return
    updateItem(bank.id, editingItemId, {
      name: eiName.trim(), detail: eiDetail.trim(),
      size: eiSize.trim() || null,
      qty: parseInt(eiQty) || 0, priority: eiPriority,
    })
    setEditingItemId(null)
    showToast('Item saved')
  }

  function handleDeleteItem(itemId: number) {
    if (!bank) return
    if (!confirm('Remove this item?')) return
    deleteItem(bank.id, itemId)
    if (editingItemId === itemId) setEditingItemId(null)
    showToast('Item removed')
  }

  async function loadWishlist() {
    if (!bank) return
    setWishlistLoading(true)
    try {
      const res = await fetch(`/api/banks/${bank.id}/wishlist`)
      if (res.ok) setWishlist(await res.json() as WishlistItem[])
    } finally {
      setWishlistLoading(false)
    }
  }

  async function handleAddWishlistItem() {
    if (!bank || !newWName.trim()) return
    const res = await fetch(`/api/banks/${bank.id}/wishlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newWName.trim(), description: newWDesc.trim() || null,
        size: newWSize.trim() || null, externalUrl: newWUrl.trim() || null,
        targetQty: parseInt(newWQty) || 1, priority: newWPriority,
      }),
    })
    if (res.ok) {
      const created = await res.json() as WishlistItem
      setWishlist(prev => [created, ...prev])
      setNewWName(''); setNewWDesc(''); setNewWSize(''); setNewWUrl(''); setNewWQty('1'); setNewWPriority('medium')
      setShowAddWish(false)
      showToast('Wishlist item added')
    } else {
      showToast('Error adding item')
    }
  }

  async function handleSaveWishlistItem(id: number) {
    const res = await fetch(`/api/wishlist/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: wName.trim(), description: wDesc.trim() || null,
        size: wSize.trim() || null, externalUrl: wUrl.trim() || null,
        targetQty: parseInt(wQty) || 1, priority: wPriority,
      }),
    })
    if (res.ok) {
      const updated = await res.json() as WishlistItem
      setWishlist(prev => prev.map(w => w.id === id ? updated : w))
      setEditingWishId(null)
      showToast('Item saved')
    } else {
      showToast('Error saving item')
    }
  }

  async function handleDeleteWishlistItem(id: number) {
    if (!confirm('Remove this wishlist item?')) return
    const res = await fetch(`/api/wishlist/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setWishlist(prev => prev.filter(w => w.id !== id))
      showToast('Item removed')
    } else {
      showToast('Error removing item')
    }
  }

  async function loadDonations() {
    if (!bank) return
    setDonationsLoading(true)
    try {
      const res = await fetch(`/api/banks/${bank.id}/donations`, { cache: 'no-store' })
      if (res.ok) setDonations(await res.json() as Donation[])
    } finally {
      setDonationsLoading(false)
    }
  }

  async function handleConfirmDonation(donation: Donation, status: 'confirmed' | 'rejected') {
    const items = status === 'confirmed'
      ? donation.items.map(di => ({
          donationItemId: di.id,
          qtyConfirmed: parseInt(confirmQtys[di.id] ?? String(di.qtyPledged)) || 0,
        }))
      : undefined
    const res = await fetch(`/api/donations/${donation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, items }),
    })
    if (res.ok) {
      setConfirmingId(null)
      setConfirmQtys({})
      showToast(status === 'confirmed' ? 'Donation confirmed' : 'Donation rejected')
      loadDonations()
    } else {
      showToast('Error updating donation')
    }
  }

  // Running totals derived from all confirmed donations
  const confirmedDonations = donations.filter(d => d.status === 'confirmed')
  const runningTotals = (() => {
    const map = new Map<string, { pledged: number; confirmed: number }>()
    for (const d of donations) {
      for (const item of d.items) {
        const existing = map.get(item.itemName) || { pledged: 0, confirmed: 0 }
        existing.pledged += item.qtyPledged
        existing.confirmed += item.qtyConfirmed ?? 0
        map.set(item.itemName, existing)
      }
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.pledged - a.pledged)
  })()

  async function handleLogout() {
    try {
      await Promise.race([
        fetch('/api/admin/logout', { method: 'POST' }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ])
    } catch {
      // Navigate regardless — session will expire on its own
    }
    window.location.href = '/admin'
  }

  // Still checking auth or waiting for store to hydrate
  if (!session || !bank) {
    // If store is done loading and we still can't find the bank, something is wrong
    const msg = ready && session ? 'Bank not found. Contact your administrator.' : 'Loading…'
    return (
      <main style={{ maxWidth: 480, margin: '80px auto 0', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: ready && session ? '#993C1D' : '#aaa' }}>{msg}</div>
      </main>
    )
  }

  return (
    <main style={{
      display: 'flex',
      flexDirection: isDesktop ? 'row' : 'column',
      minHeight: '100dvh',
      ...(isDesktop ? {} : { maxWidth: 640, margin: '0 auto' }),
    }}>

      {/* ── Desktop sidebar ── */}
      {isDesktop && (
        <aside style={{
          width: 240, flexShrink: 0,
          borderRight: '0.5px solid #eee',
          padding: '24px 16px',
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
        }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, marginBottom: 4 }}>
              Plenti
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: '#444' }}>{bank.name}</div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>
            {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''} listed
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 16, borderTop: '0.5px solid #eee' }}>
            <a href="/admin/bank-dashboard/analytics" style={{ fontSize: 13, color: '#3B6D11', textDecoration: 'underline' }}>Analytics →</a>
            <a href="/donate" style={{ fontSize: 13, color: '#888', textDecoration: 'underline' }}>← Donor view</a>
            <button onClick={handleLogout} style={btnGhost}>Sign out</button>
          </div>
        </aside>
      )}

      {/* ── Main content ── */}
      <div style={{ flex: 1, paddingBottom: 60 }}>

        {/* Mobile header */}
        {!isDesktop && (
          <header style={{
            padding: '18px 20px', borderBottom: '0.5px solid #eee',
            display: 'flex', alignItems: 'center', gap: 12,
            position: 'sticky', top: 0, background: '#fff', zIndex: 10,
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400 }}>
                {bank.name}
              </span>
            </div>
            <a href="/admin/bank-dashboard/analytics" style={{ fontSize: 12, color: '#3B6D11', textDecoration: 'underline', whiteSpace: 'nowrap' }}>Analytics</a>
            <button onClick={handleLogout} style={btnGhost}>Sign out</button>
          </header>
        )}

        <div style={{ padding: isDesktop ? '32px 40px' : 20 }}>

          {/* Items list */}
          <div style={{ ...sectionHead, marginBottom: 10 }}>
            Current needs
            <span style={{ fontWeight: 400, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: '#bbb' }}>
              — {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}
            </span>
          </div>

          {sortedItems.length === 0 ? (
            <EmptyState icon="📋" label="No items yet" sub="Search the catalog below to add your first item." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {sortedItems.map(item => (
                <div key={item.id} style={{
                  background: '#fff',
                  border: `0.5px solid ${editingItemId === item.id ? '#27500A' : '#e8e8e8'}`,
                  borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s',
                }}>
                  {editingItemId === item.id ? (
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input value={eiName} onChange={e => setEiName(e.target.value)}
                          placeholder="Item name" style={{ ...fi, flex: 2, minWidth: 140, fontSize: 13 }} />
                        <input value={eiDetail} onChange={e => setEiDetail(e.target.value)}
                          placeholder="Detail / hint" style={{ ...fi, flex: 2, minWidth: 140, fontSize: 13 }} />
                        <input value={eiSize} onChange={e => setEiSize(e.target.value)}
                          placeholder="Size (e.g. 16 oz, 1 lb)" style={{ ...fi, flex: 1, minWidth: 120, fontSize: 13 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input value={eiQty} onChange={e => setEiQty(e.target.value)}
                          type="number" min={0} placeholder="Qty needed"
                          style={{ ...fi, width: 110, fontSize: 13 }} />
                        <select value={eiPriority} onChange={e => setEiPriority(e.target.value as Item['priority'])}
                          style={{ ...fi, width: 'auto', fontSize: 13 }}>
                          <option value="high">High need</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                        <button onClick={handleSaveItem} style={btnPrimary}>Save</button>
                        <button onClick={() => setEditingItemId(null)} style={btnGhost}>Cancel</button>
                        <button onClick={() => handleDeleteItem(item.id)} style={{ ...btnDanger, marginLeft: 'auto' }}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>
                          {item.detail}
                          {item.size ? ` · ${item.size}` : ''}
                          {item.qty ? ` · ${item.qty} needed` : ''}
                          {(item.qty_received ?? 0) > 0 ? ` · ${item.qty_received} received` : ''}
                          {' · '}
                          <span style={{ color: item.priority === 'high' ? '#B94040' : item.priority === 'medium' ? '#9A6B00' : '#3B6D11' }}>
                            {item.priority}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => startEditItem(item)} style={{ ...btnGhost, fontSize: 12, padding: '4px 10px' }}>
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Catalog search */}
          <div style={card}>
            <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>
              Add an item
            </div>

            <div ref={catRef} style={{ position: 'relative', marginBottom: 8 }}>
              <input
                value={catQuery}
                onChange={e => {
                  setCatQuery(e.target.value)
                  setSelectedCat(null)
                  setCatDropdown(true)
                  setShowRequest(false)
                }}
                onFocus={() => { if (catQuery) setCatDropdown(true) }}
                placeholder="Search catalog (e.g. Peanut butter)…"
                style={{ ...fi, width: '100%', boxSizing: 'border-box' }}
              />
              {catDropdown && catQuery.trim() && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20,
                  background: '#fff', border: '0.5px solid #ddd', borderRadius: 10,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)', marginTop: 4,
                  maxHeight: 280, overflowY: 'auto',
                }}>
                  {catResults.length === 0 ? (
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontSize: 13, color: '#888', marginBottom: 8 }}>
                        No catalog match for &ldquo;{catQuery}&rdquo;
                      </div>
                      <button
                        onClick={() => { setCatDropdown(false); setShowRequest(true); setReqName(catQuery.trim()) }}
                        style={{ ...btnOutline, fontSize: 12, padding: '6px 12px' }}
                      >
                        Not in catalog? Submit a request
                      </button>
                    </div>
                  ) : (
                    <>
                      {catResults.map(c => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectCatalogItem(c)}
                          style={{
                            display: 'block', width: '100%', textAlign: 'left',
                            padding: '10px 14px', background: 'none', border: 'none',
                            borderBottom: '0.5px solid #f0f0f0', cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>
                            {c.detail}{c.category ? ` · ${c.category}` : ''}
                          </div>
                        </button>
                      ))}
                      <div style={{ padding: '10px 14px', borderTop: '0.5px solid #f0f0f0' }}>
                        <button
                          onClick={() => { setCatDropdown(false); setShowRequest(true); setReqName(catQuery.trim()) }}
                          style={{ fontSize: 12, color: '#3B6D11', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
                        >
                          Not what you&apos;re looking for? Submit a request
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {selectedCat && !showRequest && (
              <div>
                <div style={{ fontSize: 12, color: '#3B6D11', marginBottom: 8 }}>
                  Selected: <strong>{selectedCat.name}</strong>
                  {selectedCat.detail && <span style={{ color: '#888' }}> — {selectedCat.detail}</span>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input
                    value={niSize} onChange={e => setNiSize(e.target.value)}
                    placeholder="Size (e.g. 16 oz, 1 lb)"
                    style={{ ...fi, width: 150 }}
                  />
                  <input
                    value={niQty} onChange={e => setNiQty(e.target.value)}
                    type="number" min={1} placeholder="Qty needed"
                    style={{ ...fi, width: 110 }}
                  />
                  <select value={niPriority} onChange={e => setNiPriority(e.target.value as Item['priority'])}
                    style={{ ...fi, width: 'auto' }}>
                    <option value="high">High need</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <button onClick={handleAddItem} style={btnPrimary}>
                    Add to list
                  </button>
                  <button onClick={() => { setSelectedCat(null); setCatQuery(''); setNiSize('') }} style={btnGhost}>
                    Clear
                  </button>
                </div>
              </div>
            )}

            {showRequest && (
              <div style={{ paddingTop: 10, borderTop: '0.5px solid #eee' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>
                  Request a new catalog item
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  <input value={reqName} onChange={e => setReqName(e.target.value)}
                    placeholder="Item name" style={{ ...fi, flex: 2, minWidth: 140 }} />
                  <input value={reqDetail} onChange={e => setReqDetail(e.target.value)}
                    placeholder="Detail / hint (optional)" style={{ ...fi, flex: 2, minWidth: 140 }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleSubmitRequest} disabled={reqSending || !reqName.trim()} style={btnPrimary}>
                    {reqSending ? 'Sending…' : 'Submit request'}
                  </button>
                  <button onClick={() => { setShowRequest(false); setReqName(''); setReqDetail('') }} style={btnGhost}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
          {/* ── Wishlist section ── */}
          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => setShowWishlist(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10,
                fontFamily: 'inherit',
              }}
            >
              <span style={sectionHead as React.CSSProperties}>
                Wishlist ({wishlist.length} item{wishlist.length !== 1 ? 's' : ''})
              </span>
              <span style={{ fontSize: 11, color: '#aaa' }}>{showWishlist ? '▲' : '▼'}</span>
            </button>

            {showWishlist && (
              <>
                {wishlistLoading ? (
                  <div style={{ fontSize: 13, color: '#aaa', padding: '8px 0' }}>Loading…</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {wishlist.map(w => (
                      <div key={w.id} style={{
                        background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: 10, overflow: 'hidden',
                      }}>
                        {editingWishId === w.id ? (
                          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <input value={wName} onChange={e => setWName(e.target.value)}
                                placeholder="Item name" style={{ ...fi, flex: 2, minWidth: 140, fontSize: 13 }} />
                              <input value={wDesc} onChange={e => setWDesc(e.target.value)}
                                placeholder="Description" style={{ ...fi, flex: 2, minWidth: 140, fontSize: 13 }} />
                              <input value={wSize} onChange={e => setWSize(e.target.value)}
                                placeholder="Size (e.g. 16 oz)" style={{ ...fi, flex: 1, minWidth: 110, fontSize: 13 }} />
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <input value={wUrl} onChange={e => setWUrl(e.target.value)}
                                placeholder="Link (Amazon, Walmart…)" style={{ ...fi, flex: 3, minWidth: 200, fontSize: 13 }} />
                              <input value={wQty} onChange={e => setWQty(e.target.value)}
                                type="number" min={1} placeholder="Target qty"
                                style={{ ...fi, width: 90, fontSize: 13 }} />
                              <select value={wPriority} onChange={e => setWPriority(e.target.value as Item['priority'])}
                                style={{ ...fi, width: 'auto', fontSize: 13 }}>
                                <option value="high">High need</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button onClick={() => handleSaveWishlistItem(w.id)} style={btnPrimary}>Save</button>
                              <button onClick={() => setEditingWishId(null)} style={btnGhost}>Cancel</button>
                              <button onClick={() => handleDeleteWishlistItem(w.id)} style={{ ...btnDanger, marginLeft: 'auto' }}>Remove</button>
                            </div>
                          </div>
                        ) : (
                          <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>{w.name}</div>
                              <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>
                                {w.description}
                                {w.size ? ` · ${w.size}` : ''}
                                {` · qty: ${w.targetQty}`}
                                {' · '}
                                <span style={{ color: w.priority === 'high' ? '#B94040' : w.priority === 'medium' ? '#9A6B00' : '#3B6D11' }}>
                                  {w.priority}
                                </span>
                              </div>
                              {w.externalUrl && (
                                <a href={w.externalUrl} target="_blank" rel="noopener noreferrer"
                                  style={{ fontSize: 11, color: '#3B6D11', textDecoration: 'underline' }}>
                                  View link ↗
                                </a>
                              )}
                            </div>
                            <button onClick={() => {
                              setEditingWishId(w.id)
                              setWName(w.name); setWDesc(w.description || ''); setWSize(w.size || '')
                              setWUrl(w.externalUrl || ''); setWQty(String(w.targetQty)); setWPriority(w.priority)
                            }} style={{ ...btnGhost, fontSize: 12, padding: '4px 10px' }}>Edit</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {wishlist.length === 0 && !wishlistLoading && (
                      <div style={{ fontSize: 13, color: '#aaa', padding: '4px 0' }}>No wishlist items yet.</div>
                    )}
                  </div>
                )}

                {/* Add wishlist item */}
                {showAddWish ? (
                  <div style={card}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>New wishlist item</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input value={newWName} onChange={e => setNewWName(e.target.value)}
                          placeholder="Item name *" autoFocus style={{ ...fi, flex: 2, minWidth: 140 }} />
                        <input value={newWDesc} onChange={e => setNewWDesc(e.target.value)}
                          placeholder="Description" style={{ ...fi, flex: 2, minWidth: 140 }} />
                        <input value={newWSize} onChange={e => setNewWSize(e.target.value)}
                          placeholder="Size (e.g. 16 oz)" style={{ ...fi, flex: 1, minWidth: 110 }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input value={newWUrl} onChange={e => setNewWUrl(e.target.value)}
                          placeholder="Link (Amazon, Walmart…)" style={{ ...fi, flex: 3, minWidth: 200 }} />
                        <input value={newWQty} onChange={e => setNewWQty(e.target.value)}
                          type="number" min={1} placeholder="Target qty"
                          style={{ ...fi, width: 90 }} />
                        <select value={newWPriority} onChange={e => setNewWPriority(e.target.value as Item['priority'])}
                          style={{ ...fi, width: 'auto' }}>
                          <option value="high">High need</option>
                          <option value="medium">Medium</option>
                          <option value="low">Low</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleAddWishlistItem} disabled={!newWName.trim()} style={btnPrimary}>Add item</button>
                        <button onClick={() => { setShowAddWish(false); setNewWName(''); setNewWDesc(''); setNewWSize(''); setNewWUrl(''); setNewWQty('1'); setNewWPriority('medium') }} style={btnGhost}>Cancel</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddWish(true)} style={{ ...btnOutline, width: '100%' }}>
                    + Add wishlist item
                  </button>
                )}
              </>
            )}
          </div>

          {/* ── Donations section ── */}
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <button
                onClick={() => setShowDonations(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, flex: 1,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                <span style={sectionHead as React.CSSProperties}>
                  Donations
                  {donations.filter(d => d.status === 'pending').length > 0 && (
                    <span style={{
                      marginLeft: 6, background: '#B94040', color: '#fff',
                      fontSize: 10, borderRadius: 6, padding: '1px 5px',
                    }}>
                      {donations.filter(d => d.status === 'pending').length}
                    </span>
                  )}
                </span>
                <span style={{ fontSize: 11, color: '#aaa' }}>{showDonations ? '▲' : '▼'}</span>
              </button>
              <a href="/admin/intake" style={{
                fontSize: 13, fontWeight: 500, color: '#fff',
                background: '#27500A', borderRadius: 8,
                padding: '6px 12px', textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Intake desk →
              </a>
            </div>

            {showDonations && (
              <>
                {donationsLoading ? (
                  <div style={{ fontSize: 13, color: '#aaa', padding: '8px 0' }}>Loading…</div>
                ) : donations.length === 0 ? (
                  <div style={{ fontSize: 13, color: '#aaa', padding: '8px 0' }}>No donations yet.</div>
                ) : (
                  <>
                    {/* Donation list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                      {donations.map(d => (
                        <div key={d.id} style={{
                          background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: 12, overflow: 'hidden',
                        }}>
                          <div style={{ padding: '10px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                              <div style={{ fontSize: 13, fontWeight: 500 }}>
                                {d.donorName ?? 'Anonymous'}
                                {d.donorTotalDonations && d.donorTotalDonations > 1 && (
                                  <span style={{ marginLeft: 6, fontSize: 11, color: '#3B6D11' }}>
                                    ({d.donorTotalDonations} donations total)
                                  </span>
                                )}
                              </div>
                              <span style={{
                                fontSize: 11, fontWeight: 500, borderRadius: 6, padding: '2px 7px',
                                background: d.status === 'pending' ? '#FEF9EE' : d.status === 'confirmed' ? '#EAF3DE' : '#FEF3EE',
                                color: d.status === 'pending' ? '#9A6B00' : d.status === 'confirmed' ? '#27500A' : '#993C1D',
                                border: `0.5px solid ${d.status === 'pending' ? '#F0D07A' : d.status === 'confirmed' ? '#C0DD97' : '#F5C4B3'}`,
                              }}>
                                {d.status}
                              </span>
                            </div>
                            <div style={{ fontSize: 11, color: '#aaa', marginBottom: 6 }}>
                              {d.donorEmail ? `${d.donorEmail} · ` : ''}
                              {new Date(d.createdAt).toLocaleDateString()} · {d.itemCount} item{d.itemCount !== 1 ? 's' : ''} · {d.totalQtyPledged} units pledged
                              {d.referralSource && d.referralSource !== 'direct' && ` · via ${d.referralSource}`}
                            </div>
                            {d.status === 'pending' && d.claimCode && (
                              <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8,
                                background: '#f8f8f6', border: '0.5px solid #e8e8e8', borderRadius: 8,
                                padding: '6px 10px',
                              }}>
                                <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#aaa' }}>Code</span>
                                <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: '0.12em', color: '#27500A' }}>{d.claimCode}</span>
                              </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              {d.items.map(item => (
                                <div key={item.id} style={{ fontSize: 12, color: '#555' }}>
                                  • {item.itemName}
                                  {item.itemSize && ` (${item.itemSize})`}
                                  {' '}×{item.qtyPledged}
                                  {item.qtyConfirmed !== null && item.qtyConfirmed !== item.qtyPledged && (
                                    <span style={{ color: '#B94040' }}> → {item.qtyConfirmed} received</span>
                                  )}
                                  {item.qtyConfirmed !== null && item.qtyConfirmed === item.qtyPledged && (
                                    <span style={{ color: '#3B6D11' }}> ✓</span>
                                  )}
                                </div>
                              ))}
                            </div>
                            {d.donorNote && (
                              <div style={{ fontSize: 12, color: '#888', marginTop: 6, fontStyle: 'italic' }}>
                                &ldquo;{d.donorNote}&rdquo;
                              </div>
                            )}
                          </div>

                          {/* Confirm / Reject actions for pending donations */}
                          {d.status === 'pending' && (
                            <div style={{ borderTop: '0.5px solid #f0f0f0', padding: '10px 14px' }}>
                              {confirmingId === d.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <div style={{ fontSize: 12, fontWeight: 500, color: '#555' }}>
                                    Confirm qty received:
                                  </div>
                                  {d.items.map(item => (
                                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{ fontSize: 12, flex: 1, color: '#555' }}>
                                        {item.itemName}
                                        {item.itemSize && ` (${item.itemSize})`}
                                      </span>
                                      <span style={{ fontSize: 12, color: '#aaa', minWidth: 70 }}>
                                        Pledged: {item.qtyPledged}
                                      </span>
                                      <input
                                        type="number" min={0} max={item.qtyPledged}
                                        value={confirmQtys[item.id] ?? String(item.qtyPledged)}
                                        onChange={e => setConfirmQtys(q => ({ ...q, [item.id]: e.target.value }))}
                                        style={{ ...fi, width: 70, fontSize: 12, padding: '5px 8px' }}
                                      />
                                    </div>
                                  ))}
                                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                                    <button onClick={() => handleConfirmDonation(d, 'confirmed')} style={btnPrimary}>
                                      Save confirmation
                                    </button>
                                    <button onClick={() => { setConfirmingId(null); setConfirmQtys({}) }} style={btnGhost}>
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button onClick={() => setConfirmingId(d.id)} style={btnPrimary}>
                                    Confirm received
                                  </button>
                                  <button onClick={() => handleConfirmDonation(d, 'rejected')} style={btnDanger}>
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Running totals */}
                    {runningTotals.length > 0 && (
                      <div style={card}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 10 }}>
                          Running totals ({confirmedDonations.length} confirmed donation{confirmedDonations.length !== 1 ? 's' : ''})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', gap: 8, fontSize: 11, fontWeight: 500, color: '#aaa', marginBottom: 4 }}>
                            <span style={{ flex: 1 }}>Item</span>
                            <span style={{ width: 60, textAlign: 'right' }}>Pledged</span>
                            <span style={{ width: 60, textAlign: 'right' }}>Received</span>
                            <span style={{ width: 50, textAlign: 'right' }}>Rate</span>
                          </div>
                          {runningTotals.slice(0, 15).map(row => (
                            <div key={row.name} style={{ display: 'flex', gap: 8, fontSize: 12, alignItems: 'center' }}>
                              <span style={{ flex: 1, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</span>
                              <span style={{ width: 60, textAlign: 'right', color: '#888' }}>{row.pledged}</span>
                              <span style={{ width: 60, textAlign: 'right', color: '#555' }}>{row.confirmed}</span>
                              <span style={{ width: 50, textAlign: 'right', color: row.confirmed >= row.pledged ? '#3B6D11' : '#9A6B00' }}>
                                {row.pledged > 0 ? Math.round((row.confirmed / row.pledged) * 100) : 0}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

      </div>{/* /main content */}

      <Toast message={toast.message} visible={toast.visible} />
      <SupportWidget source="bank_dashboard" />
    </main>
  )
}

const sectionHead: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#aaa', marginBottom: 10,
}
const card: React.CSSProperties = {
  background: '#f8f8f6', border: '0.5px solid #e8e8e8', borderRadius: 12, padding: 14,
}
const fi: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 13, padding: '9px 12px',
  border: '0.5px solid #ddd', borderRadius: 10,
  background: '#fff', color: '#111', outline: 'none',
}
const btnPrimary: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
  padding: '9px 16px', borderRadius: 10,
  background: '#27500A', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
}
const btnOutline: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
  padding: '9px 14px', borderRadius: 10,
  background: 'transparent', color: '#3B6D11',
  border: '0.5px solid #C0DD97', cursor: 'pointer', whiteSpace: 'nowrap',
}
const btnDanger: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
  padding: '9px 14px', borderRadius: 10,
  background: 'transparent', color: '#993C1D',
  border: '0.5px solid #F5C4B3', cursor: 'pointer', whiteSpace: 'nowrap',
}
const btnGhost: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 13,
  padding: '9px 12px', borderRadius: 10,
  background: 'none', color: '#888',
  border: '0.5px solid #e8e8e8', cursor: 'pointer', whiteSpace: 'nowrap',
}
