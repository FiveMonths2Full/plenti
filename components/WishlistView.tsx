'use client'
// components/WishlistView.tsx
import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { WishlistItem } from '@/lib/types'
import { EmptyState } from './ui'

const priorityLabel = { high: 'Urgent', medium: 'Needed', low: 'Nice to have' }
const priorityColor = { high: '#B94040', medium: '#9A6B00', low: '#3B6D11' }

export default function WishlistView() {
  const { activeBankId, banks } = useStore()
  const bank = banks.find(b => b.id === activeBankId)
  const [items,   setItems]   = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeBankId) return
    setLoading(true)
    fetch(`/api/banks/${activeBankId}/wishlist`)
      .then(r => r.ok ? r.json() : [])
      .then((data: WishlistItem[]) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [activeBankId])

  if (loading) {
    return <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: '#aaa' }}>Loading…</div>
  }

  if (items.length === 0) {
    return (
      <div style={{ padding: '0 16px' }}>
        <EmptyState
          icon="🛍️"
          label="No wishlist items yet"
          sub={bank ? `${bank.name} hasn't added any external items yet.` : 'Check back soon.'}
        />
      </div>
    )
  }

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p style={{ fontSize: 12, color: '#888', margin: '4px 0 8px' }}>
        Items the food bank is looking for from online retailers.
      </p>

      {items.map(item => (
        <div key={item.id} style={{
          background: '#fff', border: '0.5px solid #e8e8e8',
          borderRadius: 14, padding: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#111', marginBottom: 2 }}>
                {item.name}
              </div>
              {(item.description || item.size) && (
                <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                  {item.description}
                  {item.description && item.size ? ' · ' : ''}
                  {item.size}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 500, borderRadius: 6, padding: '2px 7px',
                  background: item.priority === 'high' ? '#FEF3EE' : item.priority === 'medium' ? '#FEF9EE' : '#EAF3DE',
                  color: priorityColor[item.priority],
                  border: `0.5px solid ${item.priority === 'high' ? '#F5C4B3' : item.priority === 'medium' ? '#F0D07A' : '#C0DD97'}`,
                }}>
                  {priorityLabel[item.priority]}
                </span>
                {item.targetQty > 1 && (
                  <span style={{ fontSize: 11, color: '#aaa' }}>
                    Need {item.targetQty}
                  </span>
                )}
              </div>
            </div>

            {item.externalUrl && (
              <a
                href={item.externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flexShrink: 0,
                  padding: '8px 14px',
                  background: '#27500A', color: '#fff',
                  border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 500,
                  textDecoration: 'none', whiteSpace: 'nowrap',
                }}
              >
                Shop →
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
