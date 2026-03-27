'use client'
// lib/store.tsx
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { Bank, Item, CatalogItem, SelectedMap, DonatedMap, DEFAULT_BANKS } from './types'
import {
  loadSelected, saveSelected,
  loadDonated, saveDonated,
  loadActiveBank, saveActiveBank,
  loadBanksCache, saveBanksCache,
} from './storage'
import { trackEvent } from './analytics'

interface StoreCtx {
  banks: Bank[]
  catalog: CatalogItem[]
  activeBankId: number
  selected: SelectedMap
  donated: DonatedMap
  ready: boolean

  setActiveBankId: (id: number) => void

  // user actions
  toggleItem: (itemId: number) => void
  changeQty:  (itemId: number, delta: number) => void
  toggleDonated: (itemId: number) => void
  clearList: () => void

  // admin actions
  addBank:    (name: string, location: string) => void
  updateBank: (id: number, name: string, location: string) => void
  deleteBank: (id: number) => void
  addItem:    (bankId: number, item: Omit<Item, 'id'>) => void
  updateItem: (bankId: number, itemId: number, changes: Partial<Omit<Item, 'id'>>) => void
  updateItemPriority: (bankId: number, itemId: number, priority: Item['priority']) => void
  deleteItem: (bankId: number, itemId: number) => void
}

const Ctx = createContext<StoreCtx | null>(null)

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready,      setReady]      = useState(false)
  const [banks,      setBanks]      = useState<Bank[]>([])
  const [catalog,    setCatalog]    = useState<CatalogItem[]>([])
  const [activeBankId, setActiveBankIdState] = useState<number>(1)
  const [selected,   setSelected]   = useState<SelectedMap>({})
  const [donated,    setDonated]    = useState<DonatedMap>({})
  const [nextItemId, setNextItemId] = useState(300)
  const activeBankIdRef = useRef(activeBankId)

  useEffect(() => {
    activeBankIdRef.current = activeBankId
  }, [activeBankId])

  useEffect(() => {
    // 1. Load cache immediately
    const cached = loadBanksCache()
    const initialBanks = cached || DEFAULT_BANKS
    const ab = loadActiveBank(initialBanks)
    const maxId = Math.max(0, ...initialBanks.flatMap(bk => bk.items.map(i => i.id)))
    setBanks(initialBanks)
    setActiveBankIdState(ab)
    setSelected(loadSelected())
    setDonated(loadDonated())
    setNextItemId(maxId + 1)
    if (cached) setReady(true)

    // 2. Fetch catalog
    fetch('/api/catalog')
      .then(r => r.json())
      .then((data: CatalogItem[]) => { if (Array.isArray(data)) setCatalog(data) })
      .catch(() => {})

    // 3. Fetch banks from API in background
    fetch('/api/banks')
      .then(r => r.json())
      .then((data: Bank[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBanks(data)
          saveBanksCache(data)
          const maxApiId = Math.max(0, ...data.flatMap(bk => bk.items.map(i => i.id)))
          setNextItemId(prev => Math.max(prev, maxApiId + 1))
        }
        setReady(true)
      })
      .catch(() => {
        // On failure with no cache, fall back to DEFAULT_BANKS
        if (!cached) {
          setBanks(DEFAULT_BANKS)
        }
        setReady(true)
      })
  }, [])

  const setActiveBankId = useCallback((id: number) => {
    setActiveBankIdState(id)
    saveActiveBank(id)
  }, [])

  const toggleItem = useCallback((itemId: number) => {
    setSelected(prev => {
      const key = String(activeBankIdRef.current)
      const cur = { ...(prev[key] || {}) }
      if (cur[itemId]) {
        delete cur[itemId]
        trackEvent('item_deselected', { item_id: itemId, bank_id: activeBankIdRef.current })
        setDonated(d => {
          const nd = { ...d, [key]: { ...(d[key] || {}) } }
          delete nd[key][itemId]
          saveDonated(nd)
          return nd
        })
      } else {
        cur[itemId] = 1
        trackEvent('item_selected', { item_id: itemId, bank_id: activeBankIdRef.current })
      }
      const next = { ...prev, [key]: cur }
      saveSelected(next)
      return next
    })
  }, [])

  const changeQty = useCallback((itemId: number, delta: number) => {
    setSelected(prev => {
      const key = String(activeBankIdRef.current)
      const cur = prev[key]?.[itemId] ?? 1
      const next = { ...prev, [key]: { ...(prev[key] || {}), [itemId]: Math.max(1, cur + delta) } }
      saveSelected(next)
      return next
    })
  }, [])

  const toggleDonated = useCallback((itemId: number) => {
    setDonated(prev => {
      const key = String(activeBankIdRef.current)
      const next = { ...prev, [key]: { ...(prev[key] || {}), [itemId]: !prev[key]?.[itemId] } }
      saveDonated(next)
      return next
    })
  }, [])

  const clearList = useCallback(() => {
    const key = String(activeBankIdRef.current)
    trackEvent('list_cleared', { bank_id: activeBankIdRef.current })
    setSelected(prev => { const n = { ...prev, [key]: {} }; saveSelected(n); return n })
    setDonated(prev  => { const n = { ...prev, [key]: {} }; saveDonated(n);  return n })
  }, [])

  const addBank = useCallback((name: string, location: string) => {
    setBanks(prev => {
      const maxId = Math.max(0, ...prev.map(b => b.id))
      const tempId = maxId + 1
      const optimistic = [...prev, { id: tempId, name, location, items: [] }]
      saveBanksCache(optimistic)

      // Fire API call
      fetch('/api/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, location }),
      })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then((created: Bank) => {
          setBanks(cur => {
            const next = cur.map(b => b.id === tempId ? { ...created, items: created.items || [] } : b)
            saveBanksCache(next)
            return next
          })
        })
        .catch(() => {
          // Revert on error
          setBanks(cur => {
            const next = cur.filter(b => b.id !== tempId)
            saveBanksCache(next)
            return next
          })
        })

      return optimistic
    })
  }, [])

  const updateBank = useCallback((id: number, name: string, location: string) => {
    setBanks(prev => {
      const old = prev.find(b => b.id === id)
      const next = prev.map(b => b.id === id ? { ...b, name, location } : b)
      saveBanksCache(next)

      fetch(`/api/banks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, location }),
      }).catch(() => {
        // Revert
        if (old) {
          setBanks(cur => {
            const reverted = cur.map(b => b.id === id ? old : b)
            saveBanksCache(reverted)
            return reverted
          })
        }
      })

      return next
    })
  }, [])

  const deleteBank = useCallback((id: number) => {
    setBanks(prev => {
      const removed = prev.find(b => b.id === id)
      const next = prev.filter(b => b.id !== id)
      saveBanksCache(next)

      fetch(`/api/banks/${id}`, { method: 'DELETE' }).catch(() => {
        // Revert
        if (removed) {
          setBanks(cur => {
            const reverted = [...cur, removed]
            saveBanksCache(reverted)
            return reverted
          })
        }
      })

      return next
    })
  }, [])

  const addItem = useCallback((bankId: number, item: Omit<Item, 'id'>) => {
    const tempId = -(nextItemId)
    setNextItemId(n => n + 1)
    setBanks(prev => {
      const next = prev.map(b => b.id === bankId ? { ...b, items: [...b.items, { ...item, id: tempId }] } : b)
      saveBanksCache(next)

      fetch(`/api/banks/${bankId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      })
        .then(r => r.ok ? r.json() : Promise.reject(r))
        .then((created: Item) => {
          setBanks(cur => {
            const updated = cur.map(b => b.id !== bankId ? b : {
              ...b, items: b.items.map(i => i.id === tempId ? created : i)
            })
            saveBanksCache(updated)
            return updated
          })
        })
        .catch(() => {
          setBanks(cur => {
            const reverted = cur.map(b => b.id !== bankId ? b : {
              ...b, items: b.items.filter(i => i.id !== tempId)
            })
            saveBanksCache(reverted)
            return reverted
          })
        })

      return next
    })
  }, [nextItemId])

  const updateItem = useCallback((bankId: number, itemId: number, changes: Partial<Omit<Item, 'id'>>) => {
    setBanks(prev => {
      const bank = prev.find(b => b.id === bankId)
      const oldItem = bank?.items.find(i => i.id === itemId)
      const next = prev.map(b => b.id !== bankId ? b : {
        ...b, items: b.items.map(i => i.id === itemId ? { ...i, ...changes } : i)
      })
      saveBanksCache(next)

      fetch(`/api/banks/${bankId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changes),
      }).catch(() => {
        if (oldItem) {
          setBanks(cur => {
            const reverted = cur.map(b => b.id !== bankId ? b : {
              ...b, items: b.items.map(i => i.id === itemId ? oldItem : i)
            })
            saveBanksCache(reverted)
            return reverted
          })
        }
      })

      return next
    })
  }, [])

  const updateItemPriority = useCallback((bankId: number, itemId: number, priority: Item['priority']) => {
    setBanks(prev => {
      const bank = prev.find(b => b.id === bankId)
      const oldItem = bank?.items.find(i => i.id === itemId)
      const next = prev.map(b => b.id !== bankId ? b : {
        ...b, items: b.items.map(i => i.id === itemId ? { ...i, priority } : i)
      })
      saveBanksCache(next)

      fetch(`/api/banks/${bankId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priority }),
      }).catch(() => {
        if (oldItem) {
          setBanks(cur => {
            const reverted = cur.map(b => b.id !== bankId ? b : {
              ...b, items: b.items.map(i => i.id === itemId ? oldItem : i)
            })
            saveBanksCache(reverted)
            return reverted
          })
        }
      })

      return next
    })
  }, [])

  const deleteItem = useCallback((bankId: number, itemId: number) => {
    setBanks(prev => {
      const bank = prev.find(b => b.id === bankId)
      const removedItem = bank?.items.find(i => i.id === itemId)
      const next = prev.map(b => b.id !== bankId ? b : { ...b, items: b.items.filter(i => i.id !== itemId) })
      saveBanksCache(next)

      fetch(`/api/banks/${bankId}/items/${itemId}`, { method: 'DELETE' }).catch(() => {
        if (removedItem) {
          setBanks(cur => {
            const reverted = cur.map(b => b.id !== bankId ? b : {
              ...b, items: [...b.items, removedItem]
            })
            saveBanksCache(reverted)
            return reverted
          })
        }
      })

      return next
    })
    const key = String(bankId)
    setSelected(prev => {
      const n = { ...prev, [key]: { ...(prev[key] || {}) } }
      delete n[key][itemId]
      saveSelected(n)
      return n
    })
    setDonated(prev => {
      const n = { ...prev, [key]: { ...(prev[key] || {}) } }
      delete n[key][itemId]
      saveDonated(n)
      return n
    })
  }, [])

  return (
    <Ctx.Provider value={{
      banks, catalog, activeBankId, selected, donated, ready,
      setActiveBankId,
      toggleItem, changeQty, toggleDonated, clearList,
      addBank, updateBank, deleteBank, addItem, updateItem, updateItemPriority, deleteItem,
    }}>
      {children}
    </Ctx.Provider>
  )
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore must be inside StoreProvider')
  return ctx
}
