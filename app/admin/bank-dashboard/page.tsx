'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { useIsDesktop } from '@/lib/hooks'
import { Item, CatalogItem } from '@/lib/types'
import { EmptyState, Toast } from '@/components/ui'

interface SessionInfo { role: 'super' | 'bank'; bankId: number | null }

export default function BankDashboard() {
  const router = useRouter()
  const isDesktop = useIsDesktop()
  const { banks, catalog, addItem, updateItem, deleteItem } = useStore()

  const [session,   setSession]   = useState<SessionInfo | null>(null)
  const [toast,     setToast]     = useState({ visible: false, message: '' })

  // Catalog search
  const [catQuery,    setCatQuery]    = useState('')
  const [catDropdown, setCatDropdown] = useState(false)
  const [selectedCat, setSelectedCat] = useState<CatalogItem | null>(null)
  const [niQty,       setNiQty]       = useState('')
  const [niPriority,  setNiPriority]  = useState<Item['priority']>('medium')
  const catRef = useRef<HTMLDivElement>(null)

  // Request flow
  const [showRequest, setShowRequest] = useState(false)
  const [reqName,     setReqName]     = useState('')
  const [reqDetail,   setReqDetail]   = useState('')
  const [reqSending,  setReqSending]  = useState(false)

  // Edit item
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [eiName,     setEiName]     = useState('')
  const [eiDetail,   setEiDetail]   = useState('')
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

  const showToast = (msg: string) => {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500)
  }

  const bank = session?.bankId ? banks.find(b => b.id === session.bankId) : null

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
    setCatDropdown(false)
    setShowRequest(false)
    setReqName(''); setReqDetail('')
  }

  function handleAddItem() {
    if (!bank || !selectedCat) return
    addItem(bank.id, {
      name: selectedCat.name, detail: selectedCat.detail,
      qty: parseInt(niQty) || 0, priority: niPriority,
    })
    setCatQuery(''); setSelectedCat(null); setNiQty(''); setNiPriority('medium')
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
    setEiQty(String(item.qty)); setEiPriority(item.priority)
  }

  function handleSaveItem() {
    if (!bank || !editingItemId || !eiName.trim()) return
    updateItem(bank.id, editingItemId, {
      name: eiName.trim(), detail: eiDetail.trim(),
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

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  if (!session || !bank) {
    return (
      <main style={{ maxWidth: 480, margin: '80px auto 0', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#aaa' }}>Loading…</div>
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
                  <button onClick={() => { setSelectedCat(null); setCatQuery('') }} style={btnGhost}>
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
