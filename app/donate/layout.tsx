import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Donate — Plenti',
  description: 'See exactly what your local food bank needs right now and pledge what you can.',
  openGraph: {
    title: 'Give what your food bank actually needs',
    description: 'Plenti shows you the real-time needs list so every donation counts.',
    type: 'website',
    siteName: 'Plenti',
  },
  twitter: {
    card: 'summary',
    title: 'Give what your food bank actually needs',
    description: 'Plenti shows you the real-time needs list so every donation counts.',
  },
}

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
