import { cookies } from 'next/headers'

export type AdminSession = { role: 'super' | 'bank'; bankId: number | null }

export function getAdminSession(): AdminSession | null {
  const s = cookies().get('plenty_session')
  if (!s) return null
  try {
    return JSON.parse(s.value) as AdminSession
  } catch {
    return null
  }
}

export function canEditBank(session: AdminSession, bankId: string): boolean {
  return session.role === 'super' || String(session.bankId) === bankId
}
