import { sql } from '@vercel/postgres'
import { Bank } from './types'

export { sql }

export async function getBanks(): Promise<Bank[]> {
  const { rows } = await sql`
    SELECT
      b.id as bank_id, b.name as bank_name, b.location,
      i.id as item_id, i.name as item_name, i.detail, i.size, i.priority, i.qty
    FROM banks b
    LEFT JOIN items i ON i.bank_id = b.id
    ORDER BY b.id,
      CASE i.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END,
      i.id
  `
  const bankMap = new Map<number, Bank>()
  for (const row of rows) {
    if (!bankMap.has(row.bank_id)) {
      bankMap.set(row.bank_id, { id: row.bank_id, name: row.bank_name, location: row.location, items: [] })
    }
    if (row.item_id !== null) {
      bankMap.get(row.bank_id)!.items.push({
        id: row.item_id, name: row.item_name, detail: row.detail,
        size: row.size ?? null,
        priority: row.priority as 'high' | 'medium' | 'low', qty: row.qty
      })
    }
  }
  return Array.from(bankMap.values())
}
