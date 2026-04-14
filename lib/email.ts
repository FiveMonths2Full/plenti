// lib/email.ts — Transactional email via Resend
// Requires RESEND_API_KEY env var. Silently no-ops if not configured.

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.EMAIL_FROM ?? 'Plenti <johnhoover42@plenti-donate.com>'

export async function sendDonationConfirmed(opts: {
  to: string
  donorName: string
  bankName: string
  items: Array<{ itemName: string; qtyConfirmed: number }>
}) {
  if (!resend) return // not configured

  const itemLines = opts.items
    .filter(i => i.qtyConfirmed > 0)
    .map(i => `• ${i.itemName} ×${i.qtyConfirmed}`)
    .join('\n')

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Your donation to ${opts.bankName} has been received`,
    text: [
      `Hi ${opts.donorName},`,
      '',
      `Your drop-off at ${opts.bankName} has been confirmed. Thank you!`,
      '',
      'Items received:',
      itemLines,
      '',
      'Every contribution makes a real difference.',
      '',
      '— The Plenti team',
    ].join('\n'),
  }).catch(() => { /* don't let email failures break the confirm flow */ })
}

export async function sendDonationRejected(opts: {
  to: string
  donorName: string
  bankName: string
}) {
  if (!resend) return

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: `Follow up on your Plenti donation to ${opts.bankName}`,
    text: [
      `Hi ${opts.donorName},`,
      '',
      `The food bank was unable to confirm your recent donation drop-off at ${opts.bankName}.`,
      '',
      'If you believe this is an error, please contact the food bank directly.',
      '',
      '— The Plenti team',
    ].join('\n'),
  }).catch(() => {})
}
