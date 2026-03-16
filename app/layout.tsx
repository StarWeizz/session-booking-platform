import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Studio Yoga',
    template: '%s | Studio Yoga',
  },
  description: 'Réservez vos cours de yoga en ligne — simple, rapide, sans friction.',
  // manifest: '/manifest.json',  // Désactivé temporairement - réactiver quand les icônes PWA seront prêtes
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Studio Yoga',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FAF8F5',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
