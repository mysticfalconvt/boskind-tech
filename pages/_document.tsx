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

import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html className="h-screen">
      <Head />
      <body className="min-h-screen bg-gradient-to-br  from-base-100 to-base-300">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
