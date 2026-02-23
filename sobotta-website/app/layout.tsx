import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://sobotta.dev'),
  title: 'SobottaAI - Open-Source Voice-to-Text with Local AI',
  description: 'Press a hotkey. Speak. Your words appear anywhere — transcribed locally, enhanced by AI, pasted instantly. Privacy-first, cross-platform desktop app powered by Rust.',
  keywords: ['voice-to-text', 'speech recognition', 'AI transcription', 'open source', 'privacy', 'local AI', 'Whisper', 'desktop app'],
  alternates: {
    canonical: 'https://sobotta.dev',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: 'SobottaAI - Open-Source Voice-to-Text with Local AI',
    description: 'Press a hotkey. Speak. Your words appear anywhere — transcribed locally, enhanced by AI, pasted instantly.',
    url: 'https://sobotta.dev',
    siteName: 'SobottaAI',
    images: [
      {
        url: '/images/sobotta-icon.png',
        width: 1024,
        height: 1024,
        alt: 'SobottaAI - Voice-to-text with local AI',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'SobottaAI - Open-Source Voice-to-Text with Local AI',
    description: 'Press a hotkey. Speak. Your words appear anywhere — transcribed locally, enhanced by AI, pasted instantly.',
    images: ['/images/sobotta-icon.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1130',
  colorScheme: 'dark',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  )
}
