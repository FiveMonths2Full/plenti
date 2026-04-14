// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import './globals.css'
import { StoreProvider } from '@/lib/store'
import { ServiceWorkerRegistrar } from '@/components/ServiceWorkerRegistrar'
import Analytics from '@/components/Analytics'

export const metadata: Metadata = {
  title: 'Plenti — Donate What Your Food Bank Actually Needs',
  description: 'Plenti connects donors with local food banks by showing exactly what\'s needed right now — so every item you bring makes a real difference.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Plenti — Donate What Your Food Bank Actually Needs',
    description: 'Plenti connects donors with local food banks by showing exactly what\'s needed right now — so every item you bring makes a real difference.',
    type: 'website',
    siteName: 'Plenti',
  },
  twitter: {
    card: 'summary',
    title: 'Plenti — Donate What Your Food Bank Actually Needs',
    description: 'Plenti connects donors with local food banks by showing exactly what\'s needed right now — so every item you bring makes a real difference.',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#27500A',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Plenti" />
      </head>
      <body>
        <StoreProvider>
          {children}
        </StoreProvider>
        <ServiceWorkerRegistrar />
        <Analytics />
      </body>
    </html>
  )
}
