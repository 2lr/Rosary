import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import ServiceWorker from '@/components/ServiceWorker';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

/**
 * Where a relative path becomes an absolute one, for the preview card.
 *
 * The only way into this app is somebody sending you a link, so the link has
 * to look like something when it lands in a message. That needs an absolute
 * address, and the app does not otherwise know its own — APP_URL when it is
 * set, and the domain it lives at otherwise.
 */
const SITE = new URL(process.env.APP_URL?.trim() || 'https://infiniterosary.com');

export const metadata: Metadata = {
  metadataBase: SITE,
  title: { default: 'Rosaire · Rosary', template: '%s · Rosaire' },
  description:
    'Un chapelet guidé, en français ou en anglais, qui grandit avec votre prière. A guided rosary, in French or English, that grows with your prayer.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Rosaire',
  appleWebApp: {
    capable: true,
    title: 'Rosaire',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180' }],
  },
  // What a shared link looks like in a message, which is where every single
  // person who uses this app first sees it.
  openGraph: {
    type: 'website',
    siteName: 'Rosaire',
    title: 'Priez le chapelet, jour après jour.',
    description:
      'Un chapelet guidé qui grandit avec votre prière. A guided rosary that grows with your prayer.',
    url: '/',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Rosaire' }],
    locale: 'fr_FR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Priez le chapelet, jour après jour.',
    description: 'Un chapelet guidé qui grandit avec votre prière.',
    images: ['/og.png'],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: '#fbf6ec',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${cormorant.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <div className="bloom-canvas" aria-hidden />
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
