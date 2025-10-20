import { HeaderNav } from '@/components/HeaderNav';
import Providers from '@/components/Providers';
import Sidebar from '@/components/Sidebar';
import * as Sentry from '@sentry/react';
import { Fira_Code } from 'next/font/google';
import Head from 'next/head';
import Script from 'next/script';
import React from 'react';
import '../styles/globals.css';

const FiraCode = Fira_Code({
  subsets: ['latin'],
  display: 'swap',
  style: 'normal',
});

export const metadata = {
  title: 'Boskind Digital',
  description: 'Boskind Digital LLC - Web Development and Consulting Services',
  creator: 'Boskind Digital LLC',
  abstract:
    'Boskind Digital LLC - Web Development, Photography and Consulting Services',
  category: 'Web Development, Photography, Consulting',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function App({
  Component,
  pageProps,
}: {
  Component: React.ElementType;
  pageProps: any;
}) {
  const isProduction = process.env.NODE_ENV === 'production';
  // Use public env vars so value is available in the client bundle
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID ?? '';
  const umamiScriptUrl =
    process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL ??
    'https://umami.rboskind.com/script.js';

  Sentry.init({
    dsn: 'https://6b7dc650ff75f3542fe1c7a7ce3704fe@o4506610880741376.ingest.sentry.io/4506612007174144',
    integrations: [Sentry.browserTracingIntegration()],
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    enabled: isProduction,
  });
  return (
    <main className={`${FiraCode.className} `}>
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="author" content={metadata.creator} />
        <meta name="abstract" content={metadata.abstract} />
        <meta name="category" content={metadata.category} />
        <link rel="icon" type="image/png" href={metadata.icons.icon} />
        <link rel="shortcut icon" href={metadata.icons.icon} />
        {isProduction && umamiWebsiteId && (
          <Script
            src={umamiScriptUrl}
            data-website-id={umamiWebsiteId}
            strategy="afterInteractive"
          />
        )}
      </Head>
      <Providers>
        <HeaderNav />
        <Sidebar />
        <div className="drawer flex h-full w-full">
          <div
            className="drawer-content h-full w-full"
            style={{ scrollbarGutter: 'stable' }}
          >
            {/* @ts-ignore */}
            <Component {...pageProps} />
          </div>
        </div>
      </Providers>
    </main>
  );
}
