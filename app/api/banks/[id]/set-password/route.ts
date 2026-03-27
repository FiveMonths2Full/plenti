import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/auth'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = getAdminSession()
  if (!session || session.role !== 'super') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { password } = await request.json() as { password: string }
  try {
    const { sql } = await import('@vercel/postgres')
    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash(password, 10)
    await sql`UPDATE banks SET admin_password_hash = ${hash} WHERE id = ${parseInt(params.id)}`
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('set-password error:', err)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }
}
