import { NextResponse } from 'next/server'

export async function POST() {
  const isProduction = process.env.NODE_ENV === 'production'
  const response = NextResponse.json({ ok: true })
  response.cookies.set('plenti_donor', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
  })
  return response
}
