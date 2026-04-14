'use client'
// app/account/page.tsx — Donor login / register
import { useState, useEffect } from 'react'
import { useStore } from '@/lib/store'

type View = 'login' | 'register'

interface DonationRecord {
  id: number
  bankName: string
  status: string
  claimCode: string | null
  createdAt: string
  itemCount: number
  totalQtyPledged: number
  totalQtyConfirmed: number | null
  items: Array<{ itemName: string; qtyPledged: number; qtyConfirmed: number | null }>
}

export default function AccountPage() {
  const { donorSession, setDonorSession, donationVersion } = useStore()
  const [view,         setView]         = useState<View>('login')
  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [donations,    setDonations]    = useState<DonationRecord[]>([])
  const [donLoading,   setDonLoading]   = useState(false)

  // Load (and reload) donation history whenever session is active or a new donation is confirmed
  useEffect(() => {
    if (!donorSession) return
    setDonLoading(true)
    fetch('/api/donors/me/donations')
      .then(r => r.ok ? r.json() : [])
      .then((data: DonationRecord[]) => setDonations(data))
      .catch(() => {})
      .finally(() => setDonLoading(false))
  }, [donorSession, donationVersion])

  async function handleLogin() {
    if (!email.trim() || !password) { setError('Enter your email and password.'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/donors/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json() as { ok?: boolean; id?: number; name?: string; email?: string; error?: string }
      if (res.ok && data.id) {
        setDonorSession({ id: data.id, name: data.name!, email: data.email! })
      } else {
        setError(data.error || 'Invalid email or password.')
      }
    } catch {
      setError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister() {
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError('Fill in all fields (password min 8 characters).')
      return
    }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/donors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      })
      const data = await res.json() as { ok?: boolean; id?: number; name?: string; email?: string; error?: string }
      if (res.ok && data.id) {
        setDonorSession({ id: data.id, name: data.name!, email: data.email! })
      } else {
        setError(data.error || 'Registration failed.')
      }
    } catch {
      setError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await fetch('/api/donors/logout', { method: 'POST' }).catch(() => {})
    setDonorSession(null)
    setDonations([])
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', padding: '0 20px 80px' }}>
      {/* Header */}
      <header style={{ padding: '24px 0 20px', borderBottom: '0.5px solid #eee', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/donate" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, fontWeight: 400, color: '#111' }}>Plenti</span>
          </a>
          {donorSession && (
            <button onClick={handleLogout} style={btnGhost}>Sign out</button>
          )}
        </div>
      </header>

      {donorSession ? (
        /* ── Logged in: donation history ── */
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#111', marginBottom: 2 }}>
              Hi, {donorSession.name}
            </div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>{donorSession.email}</div>
            <a href="/donate" style={{
              display: 'inline-block', padding: '10px 20px',
              background: '#27500A', color: '#fff', borderRadius: 10,
              fontSize: 13, fontWeight: 600, textDecoration: 'none',
            }}>
              Donate again →
            </a>
          </div>

          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: 12 }}>
            Your donation history
          </div>

          {donLoading ? (
            <div style={{ fontSize: 13, color: '#aaa' }}>Loading…</div>
          ) : donations.length === 0 ? (
            <div style={{ background: '#f8f8f6', border: '0.5px solid #e8e8e8', borderRadius: 14, padding: '24px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 6 }}>No donations recorded yet.</div>
              <a href="/donate" style={{ fontSize: 13, color: '#27500A', textDecoration: 'underline' }}>
                Browse what&apos;s needed →
              </a>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {donations.map(d => (
                <div key={d.id} style={{
                  background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: 14, padding: 16,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{d.bankName}</div>
                    <span style={{
                      fontSize: 11, fontWeight: 500, borderRadius: 6, padding: '2px 7px',
                      background: d.status === 'pending' ? '#FEF9EE' : d.status === 'confirmed' ? '#EAF3DE' : '#FEF3EE',
                      color: d.status === 'pending' ? '#9A6B00' : d.status === 'confirmed' ? '#27500A' : '#993C1D',
                      border: `0.5px solid ${d.status === 'pending' ? '#F0D07A' : d.status === 'confirmed' ? '#C0DD97' : '#F5C4B3'}`,
                    }}>
                      {d.status}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 8 }}>
                    {new Date(d.createdAt).toLocaleDateString()} · {d.itemCount} item{d.itemCount !== 1 ? 's' : ''} · {d.totalQtyPledged} units pledged
                    {d.totalQtyConfirmed != null && ` · ${d.totalQtyConfirmed} confirmed`}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {d.items.map((item, i) => (
                      <div key={i} style={{ fontSize: 12, color: '#555' }}>
                        • {item.itemName} ×{item.qtyPledged}
                        {item.qtyConfirmed !== null && item.qtyConfirmed !== item.qtyPledged && (
                          <span style={{ color: '#B94040' }}> → {item.qtyConfirmed} received</span>
                        )}
                        {item.qtyConfirmed !== null && item.qtyConfirmed === item.qtyPledged && (
                          <span style={{ color: '#3B6D11' }}> ✓</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {d.status === 'pending' && d.claimCode && (
                    <div style={{
                      marginTop: 12, padding: '12px', background: '#f8f8f6',
                      border: '0.5px solid #e8e8e8', borderRadius: 10, textAlign: 'center',
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: 6 }}>
                        Drop-off code
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 700, letterSpacing: '0.12em', color: '#27500A', marginBottom: 8 }}>
                        {d.claimCode}
                      </div>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${d.claimCode}`}
                        alt={`QR code for ${d.claimCode}`}
                        width={90} height={90}
                        style={{ borderRadius: 6 }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Auth form ── */
        <div>
          {/* Tab toggle */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 24, border: '0.5px solid #e8e8e8', borderRadius: 10, overflow: 'hidden' }}>
            <button
              onClick={() => { setView('login'); setError('') }}
              style={{
                flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 500,
                background: view === 'login' ? '#111' : 'transparent',
                color: view === 'login' ? '#fff' : '#888',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >Sign in</button>
            <button
              onClick={() => { setView('register'); setError('') }}
              style={{
                flex: 1, padding: '11px 0', fontSize: 13, fontWeight: 500,
                background: view === 'register' ? '#111' : 'transparent',
                color: view === 'register' ? '#fff' : '#888',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
            >Create account</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {view === 'register' && (
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Your name"
                style={inputStyle}
              />
            )}
            <input
              value={email} onChange={e => setEmail(e.target.value)}
              type="email" placeholder="Email address"
              style={inputStyle}
            />
            <input
              value={password} onChange={e => setPassword(e.target.value)}
              type="password"
              placeholder={view === 'register' ? 'Password (min 8 characters)' : 'Password'}
              onKeyDown={e => e.key === 'Enter' && (view === 'login' ? handleLogin() : handleRegister())}
              style={inputStyle}
            />
            {error && <p style={{ fontSize: 12, color: '#993C1D', margin: 0 }}>{error}</p>}
            <button
              onClick={view === 'login' ? handleLogin : handleRegister}
              disabled={loading}
              style={{
                padding: '12px 0', background: loading ? '#aaa' : '#27500A', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600,
                cursor: loading ? 'wait' : 'pointer', fontFamily: 'inherit',
                marginTop: 4,
              }}
            >
              {loading
                ? (view === 'login' ? 'Signing in…' : 'Creating account…')
                : (view === 'login' ? 'Sign in' : 'Create account')}
            </button>
          </div>

          <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', marginTop: 20 }}>
            Track your donations and see your impact over time.
          </p>
        </div>
      )}
    </main>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '11px 14px',
  border: '0.5px solid #ddd',
  borderRadius: 12,
  fontSize: 14,
  fontFamily: 'inherit',
  background: '#fff',
  color: '#111',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const btnGhost: React.CSSProperties = {
  fontFamily: 'inherit', fontSize: 13,
  padding: '8px 14px', borderRadius: 10,
  background: 'none', color: '#888',
  border: '0.5px solid #e8e8e8', cursor: 'pointer',
}
