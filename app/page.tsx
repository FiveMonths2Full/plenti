// app/page.tsx — marketing landing page
import Link from 'next/link'

const steps = [
  { n: '1', label: 'Pick your local food bank', detail: 'Choose from food banks in your area that are actively tracking their needs.' },
  { n: '2', label: 'See what\'s actually needed', detail: 'Browse the real-time list of items the food bank is short on, sorted by priority.' },
  { n: '3', label: 'Shop and donate with purpose', detail: 'Bring exactly what\'s needed on your next grocery run. Every item counts.' },
]

export default function Home() {
  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      {/* Hero */}
      <section style={{
        maxWidth: 640, margin: '0 auto', width: '100%',
        padding: '72px 24px 48px',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: '#EAF3DE', borderRadius: 999,
          padding: '4px 12px', width: 'fit-content',
          fontSize: 12, fontWeight: 500, color: '#27500A',
          letterSpacing: '0.04em',
        }}>
          Food bank needs, simplified
        </div>

        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 'clamp(36px, 8vw, 56px)',
          fontWeight: 400,
          letterSpacing: -1,
          lineHeight: 1.1,
          color: '#111',
          margin: 0,
        }}>
          Plenti
        </h1>

        <p style={{ fontSize: 18, color: '#444', lineHeight: 1.5, margin: 0, maxWidth: 420 }}>
          Give what&apos;s actually needed. See what your local food bank is short on before your next grocery run.
        </p>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 8 }}>
          <Link
            href="/donate"
            style={{
              display: 'inline-block',
              background: '#27500A',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 500,
              textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}
          >
            Find a food bank →
          </Link>
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '0 24px' }}>
        <div style={{ borderTop: '0.5px solid #eee' }} />
      </div>

      {/* How it works */}
      <section style={{ maxWidth: 640, margin: '0 auto', width: '100%', padding: '48px 24px 64px' }}>
        <p style={{
          fontSize: 11, fontWeight: 500, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: '#aaa', marginBottom: 28,
        }}>
          How it works
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {steps.map(step => (
            <div key={step.n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: '#EAF3DE',
                color: '#27500A',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 600,
                flexShrink: 0,
              }}>
                {step.n}
              </div>
              <div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#111', margin: '0 0 4px' }}>{step.label}</p>
                <p style={{ fontSize: 14, color: '#666', margin: 0, lineHeight: 1.5 }}>{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '0.5px solid #eee',
        padding: '20px 24px',
        display: 'flex', justifyContent: 'center',
      }}>
        <Link
          href="/admin"
          style={{ fontSize: 12, color: '#aaa', textDecoration: 'none' }}
        >
          Food bank admin →
        </Link>
      </footer>
    </main>
  )
}
