'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useStore } from '@/lib/store'
import { Item } from '@/lib/types'
import { EmptyState, Toast } from '@/components/ui'

interface SessionInfo { role: 'super' | 'bank'; bankId: number | null }

export default function AdminDashboard() {
  const router = useRouter()
  const { banks, addBank, updateBank, deleteBank, addItem, updateItem, deleteItem } = useStore()

  const [activeBankId, setActiveBankId] = useState<number | null>(null)
  const [toast,        setToast]        = useState({ visible: false, message: '' })
  const [session,      setSession]      = useState<SessionInfo | null>(null)

  // Add bank form
  const [showAddBank, setShowAddBank] = useState(false)
  const [nbName, setNbName] = useState('')
  const [nbLoc,  setNbLoc]  = useState('')

  // Edit bank
  const [ebName, setEbName] = useState('')
  const [ebLoc,  setEbLoc]  = useState('')

  // Set password
  const [pwBankId,  setPwBankId]  = useState<number | null>(null)
  const [pwValue,   setPwValue]   = useState('')
  const [pwSaving,  setPwSaving]  = useState(false)

  // Add item form
  const [niName,     setNiName]     = useState('')
  const [niDetail,   setNiDetail]   = useState('')
  const [niQty,      setNiQty]      = useState('')
  const [niPriority, setNiPriority] = useState<Item['priority']>('medium')

  // Edit item
  const [editingItemId, setEditingItemId] = useState<number | null>(null)
  const [eiName,     setEiName]     = useState('')
  const [eiDetail,   setEiDetail]   = useState('')
  const [eiQty,      setEiQty]      = useState('')
  const [eiPriority, setEiPriority] = useState<Item['priority']>('medium')

  useEffect(() => {
    fetch('/api/admin/session')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then((d: SessionInfo) => setSession(d))
      .catch(() => router.replace('/admin'))
  }, [router])

  const visibleBanks = session?.role === 'bank' && session.bankId
    ? banks.filter(b => b.id === session.bankId)
    : banks

  useEffect(() => {
    if (!activeBankId && visibleBanks.length > 0) setActiveBankId(visibleBanks[0].id)
  }, [visibleBanks, activeBankId])

  useEffect(() => {
    const bank = banks.find(b => b.id === activeBankId)
    if (bank) { setEbName(bank.name); setEbLoc(bank.location) }
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
    addBank(nbName.trim(), nbLoc.trim() || 'Nearby')
    setNbName(''); setNbLoc(''); setShowAddBank(false)
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
    updateBank(activeBankId, ebName.trim(), ebLoc.trim() || 'Nearby')
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

  function handleAddItem() {
    if (!activeBankId || !niName.trim()) return
    addItem(activeBankId, {
      name: niName.trim(), detail: niDetail.trim(),
      qty: parseInt(niQty) || 0, priority: niPriority,
    })
    setNiName(''); setNiDetail(''); setNiQty(''); setNiPriority('medium')
    showToast('Item added')
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
    const url = `${window.location.origin}/?bank=${id}`
    navigator.clipboard?.writeText(url).catch(() => {})
    showToast('Share link copied')
  }

  const sortedItems = activeBank
    ? [...activeBank.items].sort((a, b) =>
        ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    : []

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <header style={{
        padding: '18px 20px', borderBottom: '0.5px solid #eee',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'sticky', top: 0, background: '#fff', zIndex: 10,
      }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400 }}>Plenty</span>
        <span style={{
          fontSize: 11, fontWeight: 500, letterSpacing: '0.06em', textTransform: 'uppercase',
          background: '#f5f5f3', border: '0.5px solid #e8e8e8', color: '#aaa',
          padding: '3px 9px', borderRadius: 999,
        }}>Admin</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <a href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'underline' }}>&larr; User view</a>
          <button onClick={handleLogout} style={btnGhost}>Sign out</button>
        </div>
      </header>

      <div style={{ padding: 20 }}>

        {/* ── Food banks ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={sectionHead}>Food banks</div>

          {/* Bank tabs */}
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

          {/* Add bank form */}
          {isSuper && showAddBank && (
            <div style={{ ...card, marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>New food bank</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={nbName} onChange={e => setNbName(e.target.value)}
                  placeholder="Bank name" autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleAddBank()}
                  style={{ ...fi, flex: 2, minWidth: 160 }} />
                <input value={nbLoc} onChange={e => setNbLoc(e.target.value)}
                  placeholder="Location (e.g. 1.2 mi)"
                  onKeyDown={e => e.key === 'Enter' && handleAddBank()}
                  style={{ ...fi, flex: 1, minWidth: 130 }} />
                <button onClick={handleAddBank} style={btnPrimary}>Add</button>
                <button onClick={() => { setShowAddBank(false); setNbName(''); setNbLoc('') }} style={btnGhost}>Cancel</button>
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
                <input value={ebLoc} onChange={e => setEbLoc(e.target.value)}
                  placeholder="Location" style={{ ...fi, flex: 1, minWidth: 100 }} />
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
        <section>
          <div style={sectionHead}>
            Items
            {activeBank && (
              <span style={{ fontWeight: 400, fontStyle: 'italic', textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: '#aaa' }}>
                — {activeBank.name}
              </span>
            )}
          </div>

          {sortedItems.length === 0 ? (
            <EmptyState icon="📋" label="No items yet" sub="Add items below to show donors what's needed." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
              {sortedItems.map(item => (
                <div key={item.id} style={{
                  background: '#fff', border: `0.5px solid ${editingItemId === item.id ? '#27500A' : '#e8e8e8'}`,
                  borderRadius: 10, overflow: 'hidden', transition: 'border-color 0.15s',
                }}>
                  {editingItemId === item.id ? (
                    /* ── Edit mode ── */
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
                    /* ── View mode ── */
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

          {/* Add item form */}
          {activeBank && (
            <div style={card}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#555', marginBottom: 8 }}>Add item</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <input value={niName} onChange={e => setNiName(e.target.value)}
                  placeholder="Item name" style={{ ...fi, flex: 2, minWidth: 140 }} />
                <input value={niDetail} onChange={e => setNiDetail(e.target.value)}
                  placeholder="Hint (e.g. any brand)" style={{ ...fi, flex: 2, minWidth: 140 }} />
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={niQty} onChange={e => setNiQty(e.target.value)}
                  type="number" min={1} placeholder="Qty needed" style={{ ...fi, width: 110 }} />
                <select value={niPriority} onChange={e => setNiPriority(e.target.value as Item['priority'])}
                  style={{ ...fi, width: 'auto' }}>
                  <option value="high">High need</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button onClick={handleAddItem} style={btnPrimary}>Add item</button>
              </div>
            </div>
          )}
        </section>
      </div>

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
