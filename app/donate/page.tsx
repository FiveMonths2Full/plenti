'use client'
// app/donate/page.tsx
import { useState, useEffect, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { trackEvent } from '@/lib/analytics'
import BankSelector from '@/components/BankSelector'
import NeedsView from '@/components/NeedsView'
import MyListView from '@/components/MyListView'
import { Toast } from '@/components/ui'

type Tab = 'needs' | 'list'

export default function Donate() {
  const { selected, activeBankId } = useStore()
  const [tab, setTab] = useState<Tab>('needs')
  const [toast, setToast] = useState({ visible: false, message: '' })

  // Deep-link: ?bank=ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const bankParam = params.get('bank')
    if (bankParam) {
      // Store will resolve on load; clean the URL
      window.history.replaceState({}, '', '/donate')
    }
  }, [])

  const selCount = Object.keys(selected[String(activeBankId)] || {}).length

  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message })
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500)
  }, [])

  const handleShare = useCallback(() => {
    const url = `${window.location.origin}/donate?bank=${activeBankId}`
    navigator.clipboard?.writeText(url).catch(() => {})
    showToast('Share link copied to clipboard')
    trackEvent('share_tapped', { bank_id: activeBankId })
  }, [activeBankId, showToast])

  return (
    <main style={{ maxWidth: 480, margin: '0 auto', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        padding: '24px 20px 12px',
        borderBottom: '0.5px solid #eee',
        position: 'sticky', top: 0,
        background: '#fff', zIndex: 10,
      }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, letterSpacing: -0.5, marginBottom: 2 }}>
          Plenti
        </h1>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 2 }}>Give what&apos;s actually needed.</p>
        <p style={{ fontSize: 12, color: '#bbb', marginBottom: 0 }}>See what your local food bank is short on before your next grocery run.</p>
        <BankSelector />
      </header>

      {/* Body */}
      <div style={{ flex: 1, paddingTop: 4, paddingBottom: 80, overflowY: 'auto' }}>
        {tab === 'needs' ? (
          <>
            <div style={{ padding: '16px 20px 8px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa' }}>
              Top needed items
            </div>
            <NeedsView />
          </>
        ) : (
          <>
            <div style={{ padding: '16px 20px 8px', fontSize: 11, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#aaa' }}>
              My list
            </div>
            <MyListView onShare={handleShare} />
          </>
        )}
      </div>

      {/* Tab bar */}
      <nav style={{
        position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 480,
        background: '#fff', borderTop: '0.5px solid #eee',
        display: 'flex', padding: '8px 16px 16px', gap: 8,
        zIndex: 20,
      }}>
        <TabBtn label="What's needed" active={tab === 'needs'} onClick={() => setTab('needs')} />
        <TabBtn
          label={selCount > 0 ? `My list (${selCount})` : 'My list'}
          active={tab === 'list'}
          onClick={() => { setTab('list'); trackEvent('list_tab_opened', { item_count: selCount }) }}
        />
      </nav>

      <Toast message={toast.message} visible={toast.visible} />
    </main>
  )
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '10px 8px',
        borderRadius: 10,
        border: `0.5px solid ${active ? '#111' : '#ddd'}`,
        background: active ? '#111' : 'transparent',
        color: active ? '#fff' : '#888',
        fontSize: 13, fontWeight: 500,
        transition: 'all 0.18s',
      }}
    >
      {label}
    </button>
  )
}
