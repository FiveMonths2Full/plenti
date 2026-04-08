'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { useIsDesktop } from '@/lib/hooks'
import { Item, CatalogItem } from '@/lib/types'
import { EmptyState, Toast } from '@/components/ui'

interface SessionInfo { role: 'super' | 'bank'; bankId: number | null }
interface CatalogRequest {
  id: number; name: string; detail: string; status: string
  bank_name: string | null; created_at: string
}

export default function AdminDashboard() {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const { banks, catalog, addBank, updateBank, deleteBank, addItem, updateItem, deleteItem, refreshCatalog } = useStore()

  const [activeBankId, setActiveBankId] = useState<number | null>(null)
  const [toast,        setToast]        = useState({ visible: false, message: '' })
  const [session,      setSession]      = useState<SessionInfo | null>(null)

  // Add bank form
  const [showAddBank, setShowAddBank] = useState(false)
  const [nbName, setNbName] = useState('')

  // Edit bank
  const [ebName, setEbName] = useState('')

  // Set password
  const [pwBankId,  setPwBankId]  = useState<number | null>(null)
  const [pwValue,   setPwValue]   = useState('')
  const [pwSaving,  setPwSaving]  = useState(false)

  // Catalog search (add item)
  const [catQuery,       setCatQuery]       = useState('')
  const [catDropdown,    setCatDropdown]    = useState(false)
  const [selectedCat,    setSelectedCat]    = useState<CatalogItem | null>(null)
  const [niQty,          setNiQty]          = useState('')
  const [niPriority,     setNiPriority]     = useState<Item['priority']>('medium')
  const catRef = useRef<HTMLDivElement>(null)

  // Request flow
  const [showRequest, setShowRequest]   = useState(false)
  const [reqName,     setReqName]       = useState('')
  const [reqDetail,   setReqDetail]     = useState('')
  const [reqSending,  setReqSending]    = useState(false)

  // Edit item
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [eiName,     setEiName]     = useState('')
  const [eiDetail,   setEiDetail]   = useState('')
  const [eiQty,      setEiQty]      = useState('')
  const [eiPriority, setEiPriority] = useState<Item['priority']>('medium')

  // Catalog management (super)
  const [showCatalogMgmt,   setShowCatalogMgmt]   = useState(true)
  const [catMgmtQuery,      setCatMgmtQuery]      = useState('')
  const [editingCatId,      setEditingCatId]       = useState<number | null>(null)
  const [ecName,            setEcName]             = useState('')
  const [ecDetail,          setEcDetail]           = useState('')
  const [ecCategory,        setEcCategory]         = useState('')
  const [newCatName,        setNewCatName]         = useState('')
  const [newCatDetail,      setNewCatDetail]       = useState('')
  const [newCatCategory,    setNewCatCategory]     = useState('')
  const [catSaving,         setCatSaving]          = useState(false)

  // Pending requests (super)
  const [showRequests,      setShowRequests]       = useState(false)
  const [requests,          setRequests]           = useState<CatalogRequest[]>([])
  const [requestsLoading,   setRequestsLoading]    = useState(false)

  useEffect(() => {
    fetch('/api/admin/session')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((d: SessionInfo) => setSession(d))
      .catch(() => router.replace('/admin'))
  }, [router])

  // Close catalog dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const visibleBanks = session?.role === 'bank' && session.bankId
    ? banks.filter(b => b.id === session.bankId)
    : banks

  useEffect(() => {
    if (!activeBankId && visibleBanks.length > 0) setActiveBankId(visibleBanks[0].id)
  }, [visibleBanks, activeBankId])

  useEffect(() => {
    const bank = banks.find(b => b.id === activeBankId)
    if (bank) { setEbName(bank.name) }
  }, [activeBankId, banks])

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500)
  }

  const activeBank = banks.find(b => b.id === activeBankId)
  const isSuper = session?.role === 'super'

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  function handleAddBank() {
    if (!nbName.trim()) return
    addBank(nbName.trim(), 'Nearby')
    setNbName(''); setShowAddBank(false)
    showToast(`${nbName.trim()} added`)
  }

  function handleDeleteBank(id: number) {
    if (banks.length <= 1) { showToast('Must keep at least one food bank.'); return }
    if (!confirm('Delete this food bank and all its items?')) return
    const fallback = visibleBanks.find(b => b.id !== id)
    deleteBank(id)
    setActiveBankId(fallback?.id ?? null)
    showToast('Food bank deleted')
  }

  function handleSaveBank() {
    if (!activeBankId || !ebName.trim()) return
    updateBank(activeBankId, ebName.trim(), activeBank?.location || 'Nearby')
    showToast('Saved')
  }

  async function handleSetPassword() {
    if (!pwBankId || !pwValue.trim()) return
    setPwSaving(true)
    try {
      const res = await fetch(`/api/banks/${pwBankId}/set-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwValue.trim() }),
      })
      if (res.ok) {
        showToast('Password set')
        setPwBankId(null); setPwValue('')
      } else {
        showToast('Error setting password')
      }
    } finally {
      setPwSaving(false)
    }
  }

  // Catalog search filtering
  const catResults = catQuery.trim().length >= 1
    ? catalog.filter(c => c.name.toLowerCase().includes(catQuery.toLowerCase())).slice(0, 8)
    : []

  function handleSelectCatalogItem(item: CatalogItem) {
    setSelectedCat(item)
    setCatQuery(item.name)
    setCatDropdown(false)
    setShowRequest(false)
    setReqName(''); setReqDetail('')
  }

  function handleAddItem() {
    if (!activeBankId || !selectedCat) return
    addItem(activeBankId, {
      name: selectedCat.name, detail: selectedCat.detail,
      qty: parseInt(niQty) || 0, priority: niPriority,
    })
    setCatQuery(''); setSelectedCat(null); setNiQty(''); setNiPriority('medium')
    showToast('Item added')
  }

  async function handleSubmitRequest() {
    if (!reqName.trim() || !activeBankId) return
    setReqSending(true)
    try {
      const res = await fetch('/api/catalog/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: reqName.trim(), detail: reqDetail.trim(), bankId: activeBankId }),
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
    setEiQty(String(item.qty)); setEiPriority(item.priority)
  }

  function handleSaveItem() {
    if (!activeBankId || !editingItemId || !eiName.trim()) return
    updateItem(activeBankId, editingItemId, {
      name: eiName.trim(), detail: eiDetail.trim(),
      qty: parseInt(eiQty) || 0, priority: eiPriority,
    })
    setEditingItemId(null)
    showToast('Item saved')
  }

  function handleDeleteItem(itemId: number) {
    if (!activeBankId) return
    if (!confirm('Remove this item?')) return
    deleteItem(activeBankId, itemId)
    if (editingItemId === itemId) setEditingItemId(null)
    showToast('Item removed')
  }

  function handleCopyShareLink(id: number) {
    const url = `${window.location.origin}/donate?bank=${id}`
    navigator.clipboard?.writeText(url).catch(() => {})
    showToast('Share link copied')
  }

  // Catalog management
  async function handleSaveCatalogItem(id: number) {
    setCatSaving(true)
    try {
      const res = await fetch(`/api/catalog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: ecName, detail: ecDetail, category: ecCategory }),
      })
      if (res.ok) {
        await refreshCatalog()
        setEditingCatId(null)
        showToast('Catalog item saved')
      } else {
        showToast('Error saving')
      }
    } finally { setCatSaving(false) }
  }

  async function handleDeleteCatalogItem(id: number) {
    if (!confirm('Remove this item from the catalog?')) return
    const res = await fetch(`/api/catalog/${id}`, { method: 'DELETE' })
    if (res.ok) { await refreshCatalog(); showToast('Removed from catalog') }
    else showToast('Error removing')
  }

  async function handleAddCatalogItem() {
    if (!newCatName.trim()) return
    setCatSaving(true)
    try {
      const res = await fetch('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCatName.trim(), detail: newCatDetail.trim(), category: newCatCategory.trim() || null }),
      })
      if (res.ok) {
        await refreshCatalog()
        setNewCatName(''); setNewCatDetail(''); setNewCatCategory('')
        showToast('Added to catalog')
      } else if (res.status === 409) {
        showToast('Item already in catalog')
      } else {
        showToast('Error adding item')
      }
    } finally { setCatSaving(false) }
  }

  async function loadRequests() {
    setRequestsLoading(true)
    try {
      const res = await fetch('/api/catalog/requests')
      if (res.ok) setRequests(await res.json())
    } finally { setRequestsLoading(false) }
  }

  async function handleRequestAction(id: number, action: 'approve' | 'reject') {
    const res = await fetch(`/api/catalog/requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) {
      if (action === 'approve') await refreshCatalog()
      showToast(action === 'approve' ? 'Approved & added to catalog' : 'Request rejected')
      setRequests(prev => prev.filter(r => r.id !== id))
    } else {
      showToast('Error')
    }
  }

  useEffect(() => {
    if (showRequests && isSuper) loadRequests()
  }, [showRequests, isSuper])

  const sortedItems = activeBank
    ? [...activeBank.items].sort((a, b) =>
        ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    : []

  const filteredCatalogMgmt = catMgmtQuery.trim()
    ? catalog.filter(c => c.name.toLowerCase().includes(catMgmtQuery.toLowerCase()) ||
        (c.category || '').toLowerCase().includes(catMgmtQuery.toLowerCase()))
    : catalog

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400 }}>Plenti</span>
            <span style={{
              fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
              background: '#f5f5f3', border: '0.5px solid #e8e8e8', color: '#aaa',
              padding: '3px 9px', borderRadius: 999,
            }}>Admin</span>
          </div>

          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: 8 }}>
            Food banks
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 8 }}>
            {visibleBanks.map(b => (
              <button key={b.id} onClick={() => { setActiveBankId(b.id); setEditingItemId(null) }} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', borderRadius: 8, border: 'none',
                background: b.id === activeBankId ? '#EAF3DE' : 'transparent',
                color: b.id === activeBankId ? '#27500A' : '#555',
                fontWeight: b.id === activeBankId ? 600 : 400,
                fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>{b.name}</button>
            ))}
            {isSuper && (
              <button onClick={() => setShowAddBank(v => !v)} style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '8px 12px', borderRadius: 8,
                border: `0.5px ${showAddBank ? 'solid #27500A' : 'dashed #ccc'}`,
                background: showAddBank ? '#EAF3DE' : 'transparent',
                fontSize: 13, color: showAddBank ? '#27500A' : '#aaa',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>+ Add bank</button>
            )}
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 16, borderTop: '0.5px solid #eee' }}>
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
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400 }}>Plenti</span>
          <span style={{
            fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
            background: '#f5f5f3', border: '0.5px solid #e8e8e8', color: '#aaa',
            padding: '3px 9px', borderRadius: 999,
          }}>Admin</span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <a href="/donate" style={{ fontSize: 13, color: '#888', textDecoration: 'underline' }}>&larr; Donor view</a>
            <button onClick={handleLogout} style={btnGhost}>Sign out</button>
          </div>
        </header>
      )}

      <div style={{ padding: isDesktop ? '32px 40px' : 20 }}>

        {/* ── Food banks ── */}
        <section style={{ marginBottom: 28 }}>
          {/* Bank tabs — mobile only (sidebar handles desktop) */}
          {!isDesktop && (
            <>
              <div style={sectionHead}>Food banks</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                {visibleBanks.map(b => (
                  <button key={b.id} onClick={() => { setActiveBankId(b.id); setEditingItemId(null) }} style={{
                    padding: '7px 14px', borderRadius: 999,
                    border: `0.5px solid ${b.id === activeBankId ? '#111' : '#ddd'}`,
                    background: b.id === activeBankId ? '#111' : 'transparent',
                    color: b.id === activeBankId ? '#fff' : '#888',
                    fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
                  }}>{b.name}</button>
                ))}
                {isSuper && (
                  <button onClick={() => setShowAddBank(v => !v)} style={{
                    padding: '7px 14px', borderRadius: 999,
                    border: `0.5px ${showAddBank ? 'solid #27500A' : 'dashed #ccc'}`,
                    background: showAddBank ? '#EAF3DE' : 'transparent',
                    fontSize: 13, color: showAddBank ? '#27500A' : '#aaa', cursor: 'pointer',
                  }}>+ Add bank</button>
                )}
              </div>
            </>
          )}

          {/* Add bank form */}
          {isSuper && showAddBank && (
            <div style={{ ...card, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>New food bank</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={nbName} onChange={e => setNbName(e.target.value)}
                  placeholder="Bank name" autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAddBank()}
                  style={{ ...fi, flex: 2, minWidth: 160 }} />
                <button onClick={handleAddBank} style={btnPrimary}>Add</button>
                <button onClick={() => { setShowAddBank(false); setNbName('') }} style={btnGhost}>Cancel</button>
              </div>
            </div>
          )}

          {/* Edit active bank */}
          {activeBank && (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>
                Edit — {activeBank.name}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: isSuper ? 8 : 0 }}>
                <input value={ebName} onChange={e => setEbName(e.target.value)}
                  placeholder="Bank name" style={{ ...fi, flex: 2, minWidth: 140 }} />
                <button onClick={handleSaveBank} style={btnPrimary}>Save</button>
                <button onClick={() => handleCopyShareLink(activeBank.id)} style={btnOutline}>Copy link</button>
                {isSuper && (
                  <button onClick={() => handleDeleteBank(activeBank.id)} style={btnDanger}>Delete</button>
                )}
              </div>

              {/* Set password row — super only */}
              {isSuper && (
                pwBankId === activeBank.id ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 8, borderTop: '0.5px solid #eee' }}>
                    <input
                      type="password" value={pwValue} onChange={e => setPwValue(e.target.value)}
                      placeholder="New password for this bank's admin"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSetPassword()}
                      style={{ ...fi, flex: 1, minWidth: 200 }}
                    />
                    <button onClick={handleSetPassword} disabled={pwSaving} style={btnPrimary}>
                      {pwSaving ? 'Saving…' : 'Set password'}
                    </button>
                    <button onClick={() => { setPwBankId(null); setPwValue('') }} style={btnGhost}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ paddingTop: 8, borderTop: '0.5px solid #eee' }}>
                    <button
                      onClick={() => { setPwBankId(activeBank.id); setPwValue('') }}
                      style={{ ...btnGhost, fontSize: 12 }}
                    >
                      Set bank admin password
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </section>

        {/* ── Items ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={sectionHead}>
            Items
            {activeBank && (
              <span style={{ fontWeight: 400, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: '#aaa' }}>
                — {activeBank.name}
              </span>
            )}
          </div>

          {sortedItems.length === 0 ? (
            <EmptyState icon="📋" label="No items yet" sub="Search the catalog below to add items." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {sortedItems.map(item => (
                <div key={item.id} style={{
                  background: '#fff', border: `0.5px solid ${editingItemId === item.id ? '#27500A' : '#e8e8e8'}`,
                  borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s',
                }}>
                  {editingItemId === item.id ? (
                    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input value={eiName} onChange={e => setEiName(e.target.value)}
                          placeholder="Item name" style={{ ...fi, flex: 2, minWidth: 140, fontSize: 13 }} />
                        <input value={eiDetail} onChange={e => setEiDetail(e.target.value)}
                          placeholder="Detail / hint" style={{ ...fi, flex: 2, minWidth: 140, fontSize: 13 }} />
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
                        <button onClick={() => handleDeleteItem(item.id)} style={{ ...btnDanger, marginLeft: 'auto' }}>Remove</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>
                          {item.detail}{item.qty ? ` · ${item.qty} needed` : ''}
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

          {/* Catalog search — add item */}
          {activeBank && (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>
                Search catalog to add an item
              </div>

              {/* Search input + dropdown */}
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
                          onClick={() => {
                            setCatDropdown(false)
                            setShowRequest(true)
                            setReqName(catQuery.trim())
                          }}
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
                            onClick={() => {
                              setCatDropdown(false)
                              setShowRequest(true)
                              setReqName(catQuery.trim())
                            }}
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

              {/* After catalog item selected: qty + priority + confirm */}
              {selectedCat && !showRequest && (
                <div>
                  <div style={{ fontSize: 12, color: '#3B6D11', marginBottom: 8 }}>
                    Selected: <strong>{selectedCat.name}</strong>
                    {selectedCat.detail && <span style={{ color: '#888' }}> — {selectedCat.detail}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                      Add to {activeBank.name}
                    </button>
                    <button onClick={() => { setSelectedCat(null); setCatQuery('') }} style={btnGhost}>
                      Clear
                    </button>
                  </div>
                </div>
              )}

              {/* Request form */}
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
          )}
        </section>

        {/* ── Catalog management (super only) ── */}
        {isSuper && (
          <section style={{ marginBottom: 28 }}>
            <button
              onClick={() => setShowCatalogMgmt(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10,
                fontFamily: 'inherit',
              }}
            >
              <span style={sectionHead as React.CSSProperties}>
                Catalog management
              </span>
              <span style={{ fontSize: 11, color: '#aaa' }}>{showCatalogMgmt ? '▲' : '▼'}</span>
            </button>

            {showCatalogMgmt && (
              <>
                <input
                  value={catMgmtQuery} onChange={e => setCatMgmtQuery(e.target.value)}
                  placeholder="Search catalog items…"
                  style={{ ...fi, width: '100%', boxSizing: 'border-box', marginBottom: 10 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14 }}>
                  {filteredCatalogMgmt.slice(0, 50).map(c => (
                    <div key={c.id} style={{ background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: 10 }}>
                      {editingCatId === c.id ? (
                        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <input value={ecName} onChange={e => setEcName(e.target.value)}
                              placeholder="Name" style={{ ...fi, flex: 2, minWidth: 130, fontSize: 13 }} />
                            <input value={ecDetail} onChange={e => setEcDetail(e.target.value)}
                              placeholder="Detail" style={{ ...fi, flex: 2, minWidth: 130, fontSize: 13 }} />
                            <input value={ecCategory} onChange={e => setEcCategory(e.target.value)}
                              placeholder="Category" style={{ ...fi, flex: 1, minWidth: 100, fontSize: 13 }} />
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleSaveCatalogItem(c.id)} disabled={catSaving} style={btnPrimary}>
                              {catSaving ? 'Saving…' : 'Save'}
                            </button>
                            <button onClick={() => setEditingCatId(null)} style={btnGhost}>Cancel</button>
                            <button onClick={() => handleDeleteCatalogItem(c.id)} style={{ ...btnDanger, marginLeft: 'auto' }}>Remove</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: '#aaa' }}>
                              {c.detail}{c.category ? ` · ${c.category}` : ''}
                            </div>
                          </div>
                          <button
                            onClick={() => { setEditingCatId(c.id); setEcName(c.name); setEcDetail(c.detail); setEcCategory(c.category || '') }}
                            style={{ ...btnGhost, fontSize: 12, padding: '4px 10px' }}
                          >Edit</button>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredCatalogMgmt.length > 50 && (
                    <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '8px 0' }}>
                      Showing 50 of {filteredCatalogMgmt.length} — search to filter
                    </div>
                  )}
                </div>

                {/* Add new catalog item */}
                <div style={card}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>Add to catalog</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
                      placeholder="Item name" style={{ ...fi, flex: 2, minWidth: 140 }} />
                    <input value={newCatDetail} onChange={e => setNewCatDetail(e.target.value)}
                      placeholder="Detail / hint" style={{ ...fi, flex: 2, minWidth: 140 }} />
                    <input value={newCatCategory} onChange={e => setNewCatCategory(e.target.value)}
                      placeholder="Category" style={{ ...fi, flex: 1, minWidth: 120 }} />
                  </div>
                  <button onClick={handleAddCatalogItem} disabled={catSaving || !newCatName.trim()} style={btnPrimary}>
                    Add to catalog
                  </button>
                </div>
              </>
            )}
          </section>
        )}

        {/* ── Pending requests (super only) ── */}
        {isSuper && (
          <section>
            <button
              onClick={() => setShowRequests(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginBottom: 10,
                fontFamily: 'inherit',
              }}
            >
              <span style={sectionHead as React.CSSProperties}>
                Catalog requests{requests.length > 0 && ` (${requests.length})`}
              </span>
              <span style={{ fontSize: 11, color: '#aaa' }}>{showRequests ? '▲' : '▼'}</span>
            </button>

            {showRequests && (
              requestsLoading ? (
                <div style={{ fontSize: 13, color: '#aaa', padding: '12px 0' }}>Loading…</div>
              ) : requests.length === 0 ? (
                <EmptyState icon="✓" label="No pending requests" sub="All caught up." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {requests.map(r => (
                    <div key={r.id} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{r.name}</div>
                        {r.detail && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{r.detail}</div>}
                        <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                          {r.bank_name ?? 'Unknown bank'}
                          {' · '}
                          {new Date(r.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => handleRequestAction(r.id, 'approve')} style={{ ...btnPrimary, fontSize: 12, padding: '6px 12px' }}>
                          Approve
                        </button>
                        <button onClick={() => handleRequestAction(r.id, 'reject')} style={{ ...btnDanger, fontSize: 12, padding: '6px 12px' }}>
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </section>
        )}
      </div>
      </div>{/* /main content */}

      <Toast message={toast.message} visible={toast.visible} />
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
