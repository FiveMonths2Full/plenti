import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'See What Your Food Bank Needs Today — Plenti',
  description: 'Browse your local food bank\'s real-time needs list, select what you can bring, and get a claim code for drop-off. No guessing, no waste.',
  openGraph: {
    title: 'See What Your Food Bank Needs Today — Plenti',
    description: 'Browse your local food bank\'s real-time needs list, select what you can bring, and get a claim code for drop-off. No guessing, no waste.',
    type: 'website',
    siteName: 'Plenti',
  },
  twitter: {
    card: 'summary',
    title: 'See What Your Food Bank Needs Today — Plenti',
    description: 'Browse your local food bank\'s real-time needs list, select what you can bring, and get a claim code for drop-off. No guessing, no waste.',
  },
}

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
