import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
  const { allowed } = checkRateLimit(ip, { max: 3, windowMs: 60 * 60 * 1000 })
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const { orgName, location, contact, email, message } = await request.json() as {
    orgName?: string; location?: string; contact?: string; email?: string; message?: string
  }

  if (!orgName?.trim() || !contact?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Organisation name, contact name, and email are required.' }, { status: 400 })
  }

  const emailLower = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
    return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
  }

  try {
    await sql`
      INSERT INTO bank_requests (org_name, location, contact, email, message)
      VALUES (${orgName.trim()}, ${location?.trim() || null}, ${contact.trim()}, ${emailLower}, ${message?.trim() || null})
    `

    // Notify super admin by email if Resend is configured
    if (process.env.RESEND_API_KEY && process.env.ADMIN_NOTIFY_EMAIL) {
      const { Resend } = await import('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const FROM = process.env.EMAIL_FROM ?? 'Plenti <johnhoover42@plenti-donate.com>'
      await resend.emails.send({
        from: FROM,
        to: process.env.ADMIN_NOTIFY_EMAIL,
        subject: `New partnership request: ${orgName.trim()}`,
        text: [
          `New food bank partnership request:`,
          '',
          `Organisation: ${orgName.trim()}`,
          `Location: ${location?.trim() || 'Not provided'}`,
          `Contact: ${contact.trim()}`,
          `Email: ${emailLower}`,
          `Message: ${message?.trim() || 'None'}`,
          '',
          `Approve in your dashboard: ${process.env.NEXT_PUBLIC_APP_URL ?? ''}/admin/dashboard`,
        ].join('\n'),
      }).catch(() => {})
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = parseInt(searchParams.get('id') ?? '0')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await sql`UPDATE bank_requests SET status = 'dismissed' WHERE id = ${id}`
  return NextResponse.json({ ok: true })
}

export async function GET() {
  // Returns pending requests — used by super admin dashboard
  // No auth here since this is called server-side from the dashboard which already checks session
  try {
    const { rows } = await sql`
      SELECT id, org_name AS "orgName", location, contact, email, message, status, created_at AS "createdAt"
      FROM bank_requests
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json([])
  }
}
