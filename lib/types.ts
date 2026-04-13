// lib/types.ts

export interface Item {
  id: number
  name: string
  detail: string
  size: string | null
  priority: 'high' | 'medium' | 'low'
  qty: number
}

export interface Bank {
  id: number
  name: string
  location: string
  items: Item[]
}

// Keyed by bankId, then itemId → quantity selected
export type SelectedMap = Record<string, Record<string, number>>

// Keyed by bankId, then itemId → boolean
export type DonatedMap = Record<string, Record<string, boolean>>

export interface CatalogItem {
  id: number
  name: string
  detail: string
  size: string | null
  category: string | null
}

export interface WishlistItem {
  id: number
  bankId: number
  name: string
  description: string | null
  size: string | null
  externalUrl: string | null
  targetQty: number
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

export const DEFAULT_BANKS: Bank[] = [
  {
    id: 1,
    name: 'Blacksburg Community Pantry',
    location: 'Downtown Blacksburg',
    items: [
      { id: 1,  name: 'Peanut butter',  detail: 'Any size',                  size: null, priority: 'high',   qty: 10 },
      { id: 2,  name: 'Canned beans',   detail: 'Black, kidney, or pinto',   size: null, priority: 'high',   qty: 20 },
      { id: 3,  name: 'Canned tuna',    detail: 'In water preferred',         size: null, priority: 'high',   qty: 15 },
      { id: 4,  name: 'Pasta',          detail: 'Spaghetti or penne',         size: null, priority: 'medium', qty: 12 },
      { id: 5,  name: 'Rice (2 lb)',    detail: 'White or brown',             size: null, priority: 'medium', qty: 8  },
      { id: 6,  name: 'Oatmeal',        detail: 'Instant or old-fashioned',   size: null, priority: 'low',    qty: 6  },
    ],
  },
  {
    id: 2,
    name: 'Christiansburg Food Bank',
    location: 'Christiansburg',
    items: [
      { id: 7,  name: 'Canned soup',   detail: 'Any variety',              size: null, priority: 'high',   qty: 18 },
      { id: 8,  name: 'Mac & cheese',  detail: 'Any brand',                size: null, priority: 'high',   qty: 14 },
      { id: 9,  name: 'Cooking oil',   detail: 'Vegetable or canola',      size: null, priority: 'medium', qty: 5  },
      { id: 10, name: 'Cereal',        detail: 'Low sugar preferred',      size: null, priority: 'medium', qty: 9  },
      { id: 11, name: 'Canned fruit',  detail: 'In juice, not syrup',      size: null, priority: 'low',    qty: 7  },
    ],
  },
  {
    id: 3,
    name: 'NRV Community Kitchen',
    location: 'NRV Region',
    items: [
      { id: 12, name: 'Dried lentils',    detail: 'Any color',      size: null, priority: 'high',   qty: 11 },
      { id: 13, name: 'Canned tomatoes',  detail: 'Diced or whole', size: null, priority: 'medium', qty: 8  },
      { id: 14, name: 'Flour',            detail: 'All-purpose',    size: null, priority: 'low',    qty: 4  },
    ],
  },
]
