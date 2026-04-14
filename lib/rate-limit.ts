// lib/rate-limit.ts — In-memory rate limiter per IP
// Not distributed (resets per serverless instance) but effective against
// targeted brute-force. Upgrade to Upstash Redis for multi-region precision.

const store = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  ip: string,
  opts: { max: number; windowMs: number } = { max: 10, windowMs: 15 * 60 * 1000 }
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + opts.windowMs })
    return { allowed: true, remaining: opts.max - 1 }
  }

  if (entry.count >= opts.max) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: opts.max - entry.count }
}
