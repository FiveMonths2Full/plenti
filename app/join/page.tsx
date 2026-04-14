'use client'
import { useState } from 'react'

export default function JoinPage() {
  const [orgName,   setOrgName]   = useState('')
  const [location,  setLocation]  = useState('')
  const [contact,   setContact]   = useState('')
  const [email,     setEmail]     = useState('')
  const [message,   setMessage]   = useState('')
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!orgName.trim() || !contact.trim() || !email.trim()) {
      setError('Organisation name, contact name, and email are required.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/banks/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: orgName.trim(), location: location.trim(), contact: contact.trim(), email: email.trim(), message: message.trim() }),
      })
      if (res.ok) {
        setDone(true)
      } else {
        const d = await res.json() as { error?: string }
        setError(d.error || 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: '0 auto', padding: '40px 20px', fontFamily: 'system-ui, sans-serif', color: '#1a1a1a' }}>
      <a href="/" style={{ color: '#27500A', fontSize: 14, textDecoration: 'none' }}>← Back to Plenti</a>

      <div style={{ marginTop: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Get Plenti for your food bank</h1>
        <p style={{ fontSize: 15, color: '#555', lineHeight: 1.6, marginBottom: 32 }}>
          Show donors exactly what you need in real time — so every donation counts. Free to use. Takes about 10 minutes to set up.
        </p>

        {done ? (
          <div style={{ background: '#EAF3DE', border: '0.5px solid #C0DD97', borderRadius: 14, padding: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: '#27500A', marginBottom: 8 }}>Request received!</p>
            <p style={{ fontSize: 14, color: '#3B6D11', margin: 0 }}>
              We&apos;ll be in touch at <strong>{email}</strong> within 24 hours to get you set up.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Organisation name *</label>
              <input value={orgName} onChange={e => setOrgName(e.target.value)} placeholder="e.g. BIFP Food Bank" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>City / location</label>
              <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Atlanta, GA" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Your name *</label>
              <input value={contact} onChange={e => setContact(e.target.value)} placeholder="First and last name" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Email address *</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@yourorg.org" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Anything else we should know?</label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Number of donors, current challenges, how you heard about us…"
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
            </div>

            {error && <p style={{ fontSize: 13, color: '#993C1D', margin: 0 }}>{error}</p>}

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '13px 0', background: loading ? '#aaa' : '#27500A',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Sending…' : 'Request access'}
            </button>

            <p style={{ fontSize: 12, color: '#aaa', textAlign: 'center', margin: 0 }}>
              No commitment. We&apos;ll reach out to walk you through setup.
            </p>
          </form>
        )}
      </div>

      <div style={{ marginTop: 48, borderTop: '0.5px solid #eee', paddingTop: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {[
          { icon: '📋', title: 'Real-time needs list', body: 'Add your most-needed items with priority levels. Donors see live counts.' },
          { icon: '📦', title: 'Drop-off verification', body: 'Donors get a claim code. Staff confirm what was actually received at intake.' },
          { icon: '📊', title: 'Donation analytics', body: 'Track fulfillment rates and see which items move fastest.' },
        ].map(f => (
          <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 22 }}>{f.icon}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>{f.title}</p>
              <p style={{ fontSize: 13, color: '#666', margin: 0, lineHeight: 1.5 }}>{f.body}</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 4, color: '#333',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px',
  border: '0.5px solid #ddd', borderRadius: 10,
  fontSize: 14, fontFamily: 'inherit',
  background: '#fff', color: '#111',
  outline: 'none', boxSizing: 'border-box',
}
