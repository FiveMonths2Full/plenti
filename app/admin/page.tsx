'use client'
// app/admin/page.tsx
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bank } from '@/lib/types'

export default function AdminLogin() {
  const [pw, setPw] = useState('')
  const [error, setError] = useState('')
  const [banks, setBanks] = useState<Bank[]>([])
  const [selectedBankId, setSelectedBankId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/banks')
      .then(r => r.json())
      .then((data: Bank[]) => setBanks(data))
      .catch(() => {})
  }, [])

  async function handleLogin() {
    if (!pw.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: pw,
          bankId: selectedBankId || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json() as { ok: boolean; role: string; redirectTo: string }
        window.location.href = data.redirectTo
      } else if (res.status === 429) {
        setError('Too many attempts. Try again later.')
        setPw('')
      } else {
        setError('Incorrect password. Try again.')
        setPw('')
      }
    } catch {
      setError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: '80px auto 0', padding: '0 20px' }}>
      <div style={{
        background: '#fff', border: '0.5px solid #e8e8e8',
        borderRadius: 16, padding: '28px 24px',
      }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, fontWeight: 400, marginBottom: 4 }}>
          Admin
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>
          Enter your password to manage food bank data.
        </p>

        <select
          value={selectedBankId ?? ''}
          onChange={e => setSelectedBankId(e.target.value ? Number(e.target.value) : null)}
          style={{
            width: '100%', fontSize: 14, padding: '10px 12px',
            border: '0.5px solid #ddd',
            borderRadius: 10, outline: 'none', marginBottom: 10,
            background: '#fff', color: '#111',
            fontFamily: 'inherit',
          }}
        >
          <option value="">Sign in as super admin...</option>
          {banks.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>

        <input
          type="password"
          value={pw}
          onChange={e => { setPw(e.target.value); setError('') }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Password"
          autoFocus
          style={{
            width: '100%', fontSize: 14, padding: '10px 12px',
            border: `0.5px solid ${error ? '#E24B4A' : '#ddd'}`,
            borderRadius: 10, outline: 'none', marginBottom: 10,
            background: '#fff',
          }}
        />

        {error && (
          <p style={{ fontSize: 13, color: '#993C1D', marginBottom: 10 }}>
            {error}
          </p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: 11,
            background: '#27500A', color: '#fff',
            border: 'none', borderRadius: 10,
            fontSize: 14, fontWeight: 500,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <a href="/" style={{ fontSize: 13, color: '#888', textDecoration: 'underline' }}>
          &larr; Back to Plenti
        </a>
      </div>
    </main>
  )
}
