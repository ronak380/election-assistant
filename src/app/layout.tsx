/**
 * @file src/app/layout.tsx
 * @description Root application layout for the Election Assistant.
 *              Sets up global metadata, Google Fonts, GTM/GA4 scripts,
 *              skip navigation links for accessibility, and the dark-mode-aware shell.
 *
 * @see https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates
 */

import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import './globals.css';

/** Google Tag Manager container ID from environment variables. */
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? '';

/** Google Analytics 4 Measurement ID. */
const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? '';

/**
 * Application-level metadata for SEO and Open Graph sharing.
 * Next.js uses this to generate <head> meta tags automatically.
 */
export const metadata: Metadata = {
  title: {
    default: 'ElectionGuide — Your Interactive Election Assistant',
    template: '%s | ElectionGuide',
  },
  description:
    'Understand the election process, find your polling station, and get answers to all your voting questions with our AI-powered election guide.',
  keywords: [
    'election guide', 'voter registration', 'how to vote', 'polling station locator',
    'election timeline', 'voting process', 'civic engagement', 'AI assistant',
  ],
  authors: [{ name: 'ElectionGuide Team' }],
  creator: 'ElectionGuide',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://election-guide.run.app',
    title: 'ElectionGuide — Your Interactive Election Assistant',
    description: 'Navigate the election process with confidence using our AI-powered guide.',
    siteName: 'ElectionGuide',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ElectionGuide — Your Interactive Election Assistant',
    description: 'Navigate the election process with confidence using our AI-powered guide.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/apple-touch-icon.png',
  },
};

/** Viewport configuration for mobile-first responsive design. */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#2563eb' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/**
 * RootLayout wraps every page in the application.
 * Provides global scripts (GTM, GA4), skip-to-content for A11y,
 * and the root HTML shell.
 *
 * @param {{ children: React.ReactNode }} props - Child page components.
 * @returns {JSX.Element} The root HTML document structure.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  console.log('[RootLayout] Rendering server-side...');
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Google Tag Manager — dataLayer initialization */}
        {GTM_ID && (
          <Script id="gtm-init" strategy="beforeInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        )}

        {/* Google Analytics 4 — direct integration as fallback */}
        {GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA4_ID}', { page_path: window.location.pathname });`}
            </Script>
          </>
        )}

        {/* Preconnect to Google Fonts and Maps for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* Google Tag Manager noscript fallback */}
        {GTM_ID && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
              title="Google Tag Manager"
            />
          </noscript>
        )}

        {/*
          Skip Navigation Link — WCAG 2.1 Success Criterion 2.4.1
          This allows keyboard and screen reader users to skip repetitive navigation
          and jump directly to the main content area.
        */}
        <a
          href="#main-content"
          className="skip-link"
          aria-label="Skip to main content"
        >
          Skip to main content
        </a>

        {children}
      </body>
    </html>
  );
}
