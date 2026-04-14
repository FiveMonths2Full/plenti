'use client'
// components/MyListView.tsx
import { useEffect, useRef, useState } from 'react'
import { useStore } from '@/lib/store'
import { CheckCircle, EmptyState } from './ui'
import { trackEvent } from '@/lib/analytics'

interface Props {
  onShare: () => void
}

export default function MyListView({ onShare }: Props) {
  const { banks, activeBankId, selected, donated, toggleDonated, clearList, confirmDonation, donorSession, setDonorSession } = useStore()
  const bank = banks.find(b => b.id === activeBankId)
  const key = String(activeBankId)
  const sel = selected[key] || {}
  const don = donated[key] || {}

  const selectedItems = (bank?.items || []).filter(i => sel[i.id])
  const allDonated = selectedItems.length > 0 && selectedItems.every(i => don[i.id])

  // Donation confirmation state
  const [confirming,   setConfirming]   = useState(false)
  const [confirmed,    setConfirmed]    = useState(false)
  const [confirmError, setConfirmError] = useState('')

  // Signup form state
  const [showSignup,   setShowSignup]   = useState(false)
  const [signupName,   setSignupName]   = useState('')
  const [signupEmail,  setSignupEmail]  = useState('')
  const [signupPw,     setSignupPw]     = useState('')
  const [signupError,  setSignupError]  = useState('')
  const [signupLoading,setSignupLoading]= useState(false)
  const [signupDone,   setSignupDone]   = useState(false)

  const prevAllDonated = useRef(false)
  useEffect(() => {
    if (allDonated && !prevAllDonated.current) {
      trackEvent('donation_completed', { bank_id: activeBankId, item_count: selectedItems.length })
    }
    prevAllDonated.current = allDonated
  }, [allDonated, activeBankId, selectedItems.length])

  // Reset confirmation state only when the user actively un-checks items (not when we auto-cleared after confirming)
  useEffect(() => {
    if (!allDonated && !confirmed) {
      setConfirmError('')
    }
  }, [allDonated, confirmed])

  async function handleConfirmDonation() {
    setConfirming(true)
    setConfirmError('')
    try {
      const result = await confirmDonation({ referralSource: 'direct' })
      if (result) {
        setConfirmed(true)
        if (!donorSession) setShowSignup(true)
      } else {
        setConfirmError('Something went wrong. Please try again.')
      }
    } finally {
      setConfirming(false)
    }
  }

  async function handleSignup() {
    if (!signupName.trim() || !signupEmail.trim() || signupPw.length < 8) {
      setSignupError('Please fill in all fields (password min 8 chars).')
      return
    }
    setSignupLoading(true)
    setSignupError('')
    try {
      const res = await fetch('/api/donors/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: signupName.trim(), email: signupEmail.trim(), password: signupPw }),
      })
      const data = await res.json() as { ok?: boolean; id?: number; name?: string; email?: string; error?: string }
      if (res.ok && data.id) {
        setDonorSession({ id: data.id, name: data.name!, email: data.email! })
        setSignupDone(true)
        setShowSignup(false)
      } else {
        setSignupError(data.error || 'Registration failed.')
      }
    } catch {
      setSignupError('Connection error. Try again.')
    } finally {
      setSignupLoading(false)
    }
  }

  if (selectedItems.length === 0 && !confirmed) {
    return (
      <div style={{ padding: '0 16px' }}>
        <EmptyState
          icon="🛒"
          label="Your list is empty"
          sub="Tap items on the needs list to add them here."
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* List box */}
      <div style={{
        background: '#f8f8f6', border: '0.5px solid #e8e8e8',
        borderRadius: 14, padding: 16,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>
            {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''}
          </span>
          {!confirmed && (
            <button
              onClick={clearList}
              style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer' }}
            >
              clear all
            </button>
          )}
        </div>

        {selectedItems.map(item => (
          <div
            key={item.id}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0' }}
          >
            <div onClick={() => !confirmed && toggleDonated(item.id)} style={{ cursor: confirmed ? 'default' : 'pointer' }}>
              <CheckCircle checked={!!don[item.id]} size={20} />
            </div>
            <span style={{
              flex: 1, fontSize: 14,
              textDecoration: don[item.id] ? 'line-through' : 'none',
              color: don[item.id] ? '#aaa' : '#111',
              transition: 'color 0.15s',
            }}>
              {item.name}
              {item.size ? <span style={{ fontSize: 12, color: '#aaa', marginLeft: 4 }}>· {item.size}</span> : null}
            </span>
            <span style={{ fontSize: 12, color: '#aaa', flexShrink: 0 }}>
              ×{sel[item.id] || 1}
            </span>
          </div>
        ))}
      </div>

      {/* Confirm donation button — shown when all items are checked */}
      {allDonated && !confirmed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={handleConfirmDonation}
            disabled={confirming}
            style={{
              width: '100%', padding: '13px 0',
              background: confirming ? '#aaa' : '#27500A',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 14, fontWeight: 600, cursor: confirming ? 'wait' : 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {confirming ? 'Confirming…' : 'Confirm my donation'}
          </button>
          {confirmError && (
            <p style={{ fontSize: 12, color: '#993C1D', textAlign: 'center', margin: 0 }}>{confirmError}</p>
          )}
        </div>
      )}

      {/* Success banner — shown after confirmation */}
      {confirmed && (
        <div style={{
          background: '#EAF3DE', border: '0.5px solid #C0DD97',
          borderRadius: 14, padding: 16, textAlign: 'center',
          animation: 'fadeUp 0.3s ease',
        }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: '#27500A', margin: '0 0 4px' }}>
            Thank you — your donation is recorded.
          </p>
          <p style={{ fontSize: 13, color: '#3B6D11', margin: '0 0 12px' }}>
            Every item makes a difference.
          </p>
          <button
            onClick={() => setConfirmed(false)}
            style={{
              fontSize: 12, color: '#27500A', background: 'none', border: '0.5px solid #C0DD97',
              borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Donate again
          </button>
        </div>
      )}

      {/* Post-donation signup prompt */}
      {confirmed && showSignup && !signupDone && (
        <div style={{
          background: '#fff', border: '0.5px solid #e8e8e8',
          borderRadius: 14, padding: 16,
          animation: 'fadeUp 0.3s ease',
        }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: '0 0 4px' }}>
            Track your donations
          </p>
          <p style={{ fontSize: 12, color: '#888', margin: '0 0 12px' }}>
            Create a free account to see your donation history.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input
              value={signupName} onChange={e => setSignupName(e.target.value)}
              placeholder="Your name"
              style={inputStyle}
            />
            <input
              value={signupEmail} onChange={e => setSignupEmail(e.target.value)}
              type="email" placeholder="Email address"
              style={inputStyle}
            />
            <input
              value={signupPw} onChange={e => setSignupPw(e.target.value)}
              type="password" placeholder="Password (min 8 chars)"
              style={inputStyle}
            />
            {signupError && (
              <p style={{ fontSize: 12, color: '#993C1D', margin: 0 }}>{signupError}</p>
            )}
            <button
              onClick={handleSignup}
              disabled={signupLoading}
              style={{
                padding: '10px 0', background: '#27500A', color: '#fff',
                border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 500,
                cursor: signupLoading ? 'wait' : 'pointer',
              }}
            >
              {signupLoading ? 'Creating account…' : 'Create account'}
            </button>
            <button
              onClick={() => setShowSignup(false)}
              style={{ fontSize: 12, color: '#aaa', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* Signed-in confirmation */}
      {confirmed && (signupDone || donorSession) && (
        <p style={{ fontSize: 12, color: '#3B6D11', textAlign: 'center', margin: 0 }}>
          Logged in as {donorSession?.name ?? signupName} · your donation was saved to your account.
        </p>
      )}

      {/* Share button */}
      <button
        onClick={onShare}
        style={{
          width: '100%', padding: 12,
          border: '0.5px solid #C0DD97', borderRadius: 10,
          background: 'transparent', color: '#3B6D11',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          transition: 'background 0.15s',
        }}
      >
        Share this food bank&apos;s needs
      </button>

      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:none } }`}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '9px 12px',
  border: '0.5px solid #ddd',
  borderRadius: 10,
  fontSize: 13,
  fontFamily: 'inherit',
  background: '#fff',
  color: '#111',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
