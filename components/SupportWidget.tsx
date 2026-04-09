'use client'
import { useState, useRef, useEffect } from 'react'

interface Props {
  source: 'donor' | 'bank_dashboard' | 'admin_dashboard'
  bottomOffset?: number
}

export default function SupportWidget({ source, bottomOffset = 24 }: Props) {
  const [open,    setOpen]    = useState(false)
  const [message, setMessage] = useState('')
  const [email,   setEmail]   = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  useEffect(() => {
    if (open && !sent) setTimeout(() => textareaRef.current?.focus(), 50)
  }, [open, sent])

  async function handleSubmit() {
    if (!message.trim()) return
    setSending(true)
    try {
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim(), email: email.trim() || null, source }),
      })
      setSent(true)
      setMessage('')
      setEmail('')
    } catch {
      // best-effort
    } finally {
      setSending(false)
    }
  }

  function toggle() {
    setOpen(o => !o)
    setSent(false)
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        bottom: bottomOffset,
        right: 20,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {open && (
        <div style={{
          width: 272,
          background: '#fff',
          border: '0.5px solid #e4e4e2',
          borderRadius: 14,
          boxShadow: '0 4px 24px rgba(0,0,0,0.11)',
          overflow: 'hidden',
        }}>
          {/* Card header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '0.5px solid #f0f0ee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>Send feedback</span>
            <button
              onClick={() => setOpen(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18, lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </div>

          {sent ? (
            <div style={{ padding: '24px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🙌</div>
              <p style={{ fontSize: 14, fontWeight: 500, color: '#111', margin: '0 0 4px' }}>Thanks!</p>
              <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>We'll take a look shortly.</p>
              <button
                onClick={() => setOpen(false)}
                style={{ fontSize: 13, color: '#27500A', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Close
              </button>
            </div>
          ) : (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={3}
                style={{
                  fontSize: 13, padding: '9px 10px',
                  border: '0.5px solid #ddd', borderRadius: 8,
                  outline: 'none', resize: 'none',
                  fontFamily: 'inherit', color: '#111', lineHeight: 1.5,
                  width: '100%', boxSizing: 'border-box',
                }}
              />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email (optional)"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  fontSize: 13, padding: '8px 10px',
                  border: '0.5px solid #ddd', borderRadius: 8,
                  outline: 'none', fontFamily: 'inherit', color: '#111',
                  width: '100%', boxSizing: 'border-box',
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={sending || !message.trim()}
                style={{
                  padding: '9px 0',
                  background: '#27500A', color: '#fff',
                  border: 'none', borderRadius: 8,
                  fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                  cursor: sending || !message.trim() ? 'default' : 'pointer',
                  opacity: sending || !message.trim() ? 0.55 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={toggle}
        title="Send feedback"
        style={{
          width: 38, height: 38,
          borderRadius: '50%',
          background: open ? '#27500A' : '#fff',
          border: `0.5px solid ${open ? '#27500A' : '#d0d0ce'}`,
          color: open ? '#fff' : '#555',
          fontSize: 15, fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        {open ? '×' : '?'}
      </button>
    </div>
  )
}
