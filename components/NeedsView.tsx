'use client'
// components/NeedsView.tsx
import { useStore } from '@/lib/store'
import { CheckCircle, PriorityBadge, EmptyState, Spinner } from './ui'
import { Item } from '@/lib/types'

function sortItems(items: Item[]) {
  const order = { high: 0, medium: 1, low: 2 }
  return [...items].sort((a, b) => order[a.priority] - order[b.priority])
}

export default function NeedsView() {
  const { banks, activeBankId, selected, toggleItem, changeQty, ready } = useStore()
  const bank = banks.find(b => b.id === activeBankId)
  const key = String(activeBankId)
  const sel = selected[key] || {}

  if (!ready) return <Spinner />

  if (!bank || bank.items.length === 0) {
    return (
      <EmptyState
        icon="🥫"
        label="Nothing listed yet"
        sub="This food bank hasn't added items yet. Check back soon."
      />
    )
  }

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
      {sortItems(bank.items).map(item => {
        const isSelected = !!sel[item.id]
        const qty = sel[item.id] || 1

        return (
          <div
            key={item.id}
            onClick={() => toggleItem(item.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '13px 14px',
              background: isSelected ? '#EAF3DE' : '#fff',
              border: `0.5px solid ${isSelected ? '#639922' : '#e8e8e8'}`,
              borderRadius: 14, cursor: 'pointer',
              transition: 'background 0.18s, border-color 0.18s',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <CheckCircle checked={isSelected} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.name}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 1 }}>
                {item.detail}
                {item.size ? ` · ${item.size}` : ''}
                {(() => { const n = Math.max(0, item.qty - (item.qty_received ?? 0)); return n > 0 ? ` · ${n} needed` : '' })()}
              </div>
            </div>

            {isSelected ? (
              <div
                onClick={e => e.stopPropagation()}
                style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
              >
                <button
                  onClick={() => changeQty(item.id, -1)}
                  style={stepperBtn}
                >−</button>
                <span style={{ fontSize: 13, fontWeight: 500, minWidth: 16, textAlign: 'center' }}>
                  {qty}
                </span>
                <button
                  onClick={() => changeQty(item.id, 1)}
                  style={stepperBtn}
                >+</button>
              </div>
            ) : (
              <PriorityBadge priority={item.priority} />
            )}
          </div>
        )
      })}
    </div>
  )
}

const stepperBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: '50%',
  border: '0.5px solid #ddd', background: '#f5f5f5',
  fontSize: 16, display: 'flex', alignItems: 'center',
  justifyContent: 'center', cursor: 'pointer',
  transition: 'background 0.15s',
}
