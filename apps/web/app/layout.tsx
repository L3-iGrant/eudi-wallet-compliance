import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { SiteNav } from './_components/SiteNav';
import { SiteFooter } from './_components/SiteFooter';
import { Breadcrumbs } from './_components/Breadcrumbs';
import { SearchOverlay } from './_components/SearchOverlay';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://eudi-wallet-compliance.igrant.io';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'EUDI Wallet Compliance · iGrant.io',
    template: '%s · EUDI Wallet Compliance · iGrant.io',
  },
  description:
    'The reference conformance toolkit for EUDI Wallet infrastructure providers. Free, open-source, anchored in EUDI Wallet specs from ETSI, IETF, ISO, OpenID, and W3C. Maintained by iGrant.io.',
  applicationName: 'EUDI Wallet Compliance',
  authors: [{ name: 'iGrant.io', url: 'https://igrant.io' }],
  creator: 'iGrant.io',
  publisher: 'iGrant.io',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'EUDI Wallet Compliance',
    title: 'EUDI Wallet Compliance · iGrant.io',
    description:
      'The reference conformance toolkit for EUDI Wallet infrastructure providers, anchored in EUDI Wallet specs from ETSI, IETF, ISO, OpenID, and W3C.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EUDI Wallet Compliance · iGrant.io',
    description:
      'The reference conformance toolkit for EUDI Wallet infrastructure providers.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-zinc-900 focus:shadow-lg focus:outline focus:outline-2 focus:outline-zinc-900 dark:focus:bg-zinc-900 dark:focus:text-white"
        >
          Skip to main content
        </a>
        <SiteNav />
        <Breadcrumbs />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
        <SearchOverlay />
      </body>
    </html>
  );
}
