'use client'
// app/admin/intake/page.tsx — Mobile-first intake desk for food bank staff
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface DonationItem {
  id: number
  itemName: string
  itemSize: string | null
  qtyPledged: number
}

interface DonationLookup {
  id: number
  status: string
  claim_code: string
  donor_name: string | null
  items: DonationItem[]
}

type Flash = 'confirmed' | 'rejected' | null

export default function IntakePage() {
  const router = useRouter()
  const [authed, setAuthed]   = useState(false)
  const [code,   setCode]     = useState('')
  const [loading, setLoading] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [donation, setDonation] = useState<DonationLookup | null>(null)
  const [qtys,   setQtys]     = useState<Record<number, string>>({})
  const [saving, setSaving]   = useState(false)
  const [flash,  setFlash]    = useState<Flash>(null)

  // QR scan state
  const [scanning, setScanning] = useState(false)
  const [scanSupported, setScanSupported] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<unknown>(null)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    // Check auth
    fetch('/api/admin/session', { cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(() => setAuthed(true))
      .catch(() => router.replace('/admin'))

    // Check BarcodeDetector support
    if ('BarcodeDetector' in window) {
      setScanSupported(true)
    }
  }, [router])

  const handleLookup = useCallback(async (codeOverride?: string) => {
    const target = (codeOverride ?? code).trim().toUpperCase()
    if (!target) return
    setLoading(true)
    setLookupError('')
    setDonation(null)
    try {
      const res = await fetch(`/api/donations/lookup?code=${encodeURIComponent(target)}`)
      const data = await res.json() as DonationLookup & { error?: string; status?: string }
      if (res.status === 404) {
        setLookupError('Donation not found. Check the code and try again.')
      } else if (res.status === 410) {
        setLookupError(`Already ${data.status ?? 'processed'} — cannot confirm again.`)
      } else if (!res.ok) {
        setLookupError(data.error ?? 'Lookup failed.')
      } else {
        setDonation(data)
        setQtys(Object.fromEntries(data.items.map(i => [i.id, String(i.qtyPledged)])))
      }
    } catch {
      setLookupError('Connection error. Try again.')
    } finally {
      setLoading(false)
    }
  }, [code])

  async function handleConfirm(status: 'confirmed' | 'rejected') {
    if (!donation) return
    setSaving(true)
    try {
      const items = status === 'confirmed'
        ? donation.items.map(i => ({
            donationItemId: i.id,
            qtyConfirmed: parseInt(qtys[i.id] ?? String(i.qtyPledged)) || 0,
          }))
        : undefined
      const res = await fetch(`/api/donations/${donation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, items }),
      })
      if (res.ok) {
        setFlash(status)
        setTimeout(() => {
          setFlash(null)
          setDonation(null)
          setCode('')
          setQtys({})
          setLookupError('')
        }, 2000)
      } else {
        setLookupError('Failed to update donation. Try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  // QR scanning via BarcodeDetector
  const stopScan = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    setScanning(false)
  }, [])

  const startScan = useCallback(async () => {
    if (!('BarcodeDetector' in window)) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      setScanning(true)
      // Wait for video element to mount
      setTimeout(async () => {
        if (!videoRef.current) return
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        detectorRef.current = detector

        const scan = async () => {
          if (!videoRef.current || videoRef.current.readyState < 2) {
            rafRef.current = requestAnimationFrame(scan)
            return
          }
          try {
            const barcodes = await detector.detect(videoRef.current)
            if (barcodes.length > 0) {
              const raw = barcodes[0].rawValue as string
              stopScan()
              setCode(raw.trim().toUpperCase())
              handleLookup(raw.trim().toUpperCase())
              return
            }
          } catch { /* ignore detect errors */ }
          rafRef.current = requestAnimationFrame(scan)
        }
        rafRef.current = requestAnimationFrame(scan)
      }, 100)
    } catch {
      setLookupError('Camera access denied. Enter the code manually.')
    }
  }, [handleLookup, stopScan])

  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop())
    }
  }, [])

  if (!authed) {
    return (
      <main style={{ maxWidth: 480, margin: '80px auto 0', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#aaa' }}>Loading…</div>
      </main>
    )
  }

  // Full-screen flash states
  if (flash) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: flash === 'confirmed' ? '#27500A' : '#993C1D',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: '#fff',
      }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>
          {flash === 'confirmed' ? '✓' : '✗'}
        </div>
        <div style={{ fontSize: 22, fontWeight: 600 }}>
          {flash === 'confirmed' ? 'Received! Thank you.' : 'Not confirmed.'}
        </div>
      </div>
    )
  }

  // QR scan overlay
  if (scanning) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 50 }}>
        <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 200, height: 200,
            border: '3px solid rgba(255,255,255,0.8)',
            borderRadius: 16,
          }} />
          <p style={{ color: '#fff', fontSize: 14, marginTop: 20, textAlign: 'center', padding: '0 40px' }}>
            Point at the QR code
          </p>
        </div>
        <button
          onClick={stopScan}
          style={{
            position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255,255,255,0.15)', color: '#fff',
            border: '1px solid rgba(255,255,255,0.4)', borderRadius: 12,
            fontSize: 15, fontWeight: 500, padding: '12px 32px', cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', padding: '0 20px 60px', fontFamily: 'inherit' }}>
      {/* Header */}
      <header style={{ padding: '24px 0 20px', borderBottom: '0.5px solid #eee', marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, fontWeight: 400, color: '#111' }}>
              Plenti Intake
            </div>
            <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
              Look up a donor&apos;s drop-off code
            </div>
          </div>
          <a href="/admin/bank-dashboard" style={{ fontSize: 13, color: '#888', textDecoration: 'underline' }}>
            ← Back
          </a>
        </div>
      </header>

      {!donation ? (
        /* ── Code lookup ── */
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setLookupError('') }}
              onKeyDown={e => e.key === 'Enter' && handleLookup()}
              placeholder="Enter 6-char code (e.g. A3X7K2)"
              maxLength={6}
              style={{
                flex: 1, padding: '14px 16px',
                border: '0.5px solid #ddd', borderRadius: 12,
                fontSize: 18, fontFamily: 'monospace', fontWeight: 600,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: '#27500A', outline: 'none', background: '#fff',
              }}
            />
            <button
              onClick={() => handleLookup()}
              disabled={loading || !code.trim()}
              style={{
                padding: '14px 20px', background: loading ? '#aaa' : '#27500A',
                color: '#fff', border: 'none', borderRadius: 12,
                fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer',
                fontFamily: 'inherit', whiteSpace: 'nowrap',
              }}
            >
              {loading ? '…' : 'Look up'}
            </button>
          </div>

          {lookupError && (
            <div style={{ fontSize: 13, color: '#993C1D', marginBottom: 16, padding: '10px 14px', background: '#FEF3EE', borderRadius: 10 }}>
              {lookupError}
            </div>
          )}

          {scanSupported && (
            <button
              onClick={startScan}
              style={{
                width: '100%', padding: '14px 0',
                background: 'transparent', color: '#3B6D11',
                border: '0.5px solid #C0DD97', borderRadius: 12,
                fontSize: 15, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Scan QR Code
            </button>
          )}
        </div>
      ) : (
        /* ── Donation found ── */
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#111', marginBottom: 4 }}>
              {donation.donor_name ?? 'Anonymous donor'}
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#f8f8f6', border: '0.5px solid #e8e8e8', borderRadius: 8, padding: '4px 10px' }}>
              <span style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Code</span>
              <span style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 700, letterSpacing: '0.12em', color: '#27500A' }}>
                {donation.claim_code}
              </span>
            </div>
          </div>

          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa', marginBottom: 10 }}>
            Confirm qty received
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {donation.items.map(item => (
              <div key={item.id} style={{
                background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: 12,
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{item.itemName}</div>
                  {item.itemSize && (
                    <div style={{ fontSize: 12, color: '#aaa', marginTop: 1 }}>{item.itemSize}</div>
                  )}
                  <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>
                    Pledged: {item.qtyPledged}
                  </div>
                </div>
                {/* Stepper */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                  <button
                    onClick={() => setQtys(q => ({ ...q, [item.id]: String(Math.max(0, parseInt(q[item.id] ?? String(item.qtyPledged)) - 1)) }))}
                    style={stepperBtn}
                  >−</button>
                  <span style={{ fontSize: 18, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>
                    {qtys[item.id] ?? item.qtyPledged}
                  </span>
                  <button
                    onClick={() => setQtys(q => ({ ...q, [item.id]: String(parseInt(q[item.id] ?? String(item.qtyPledged)) + 1) }))}
                    style={stepperBtn}
                  >+</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => handleConfirm('confirmed')}
              disabled={saving}
              style={{
                width: '100%', padding: '16px 0',
                background: saving ? '#aaa' : '#27500A',
                color: '#fff', border: 'none', borderRadius: 14,
                fontSize: 16, fontWeight: 600, cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Confirm Received
            </button>
            <button
              onClick={() => handleConfirm('rejected')}
              disabled={saving}
              style={{
                width: '100%', padding: '16px 0',
                background: 'transparent', color: '#993C1D',
                border: '0.5px solid #F5C4B3', borderRadius: 14,
                fontSize: 16, fontWeight: 500, cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Could Not Confirm
            </button>
            <button
              onClick={() => { setDonation(null); setCode(''); setQtys({}); setLookupError('') }}
              style={{
                fontSize: 13, color: '#aaa', background: 'none', border: 'none',
                cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit',
                marginTop: 4,
              }}
            >
              Back to lookup
            </button>
          </div>

          {lookupError && (
            <div style={{ fontSize: 13, color: '#993C1D', marginTop: 16, padding: '10px 14px', background: '#FEF3EE', borderRadius: 10 }}>
              {lookupError}
            </div>
          )}
        </div>
      )}
    </main>
  )
}

const stepperBtn: React.CSSProperties = {
  width: 36, height: 36, borderRadius: '50%',
  border: '0.5px solid #ddd', background: '#f5f5f5',
  fontSize: 20, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer',
  fontFamily: 'inherit',
}
