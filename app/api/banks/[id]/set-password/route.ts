import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import bcrypt from 'bcryptjs'
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
  const hash = await bcrypt.hash(password, 10)
  await sql`UPDATE banks SET admin_password_hash = ${hash} WHERE id = ${parseInt(params.id)}`
  return NextResponse.json({ ok: true })
}
