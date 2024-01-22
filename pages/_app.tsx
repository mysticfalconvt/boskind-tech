import * as Sentry from "@sentry/react";
import "../styles/globals.css";
import { Fira_Code } from "next/font/google";
import { HeaderNav } from "@/components/HeaderNav";
import React from "react";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";
import Head from "next/head";
import { AppProps } from "next/app";

const FiraCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  style: "normal",
});

export const metadata = {
  title: "Boskind Digital",
  description: "Boskind Digital LLC - Web Development and Consulting Services",
  creator: "Boskind Digital LLC",
  abstract:
    "Boskind Digital LLC - Web Development, Photography and Consulting Services",
  category: "Web Development, Photography, Consulting",
  icons: {
    icon: "images/favicon.ico",
  },
};

export default function App({ Component, pageProps }: AppProps) {
  const isProduction = process.env.NODE_ENV === "production";

  Sentry.init({
    dsn: "https://6b7dc650ff75f3542fe1c7a7ce3704fe@o4506610880741376.ingest.sentry.io/4506612007174144",
    integrations: [
      new Sentry.BrowserTracing({
        // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
        tracePropagationTargets: [
          "localhost",
          /^https:\/\/yourserver\.io\/api/,
        ],
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
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
        {isProduction && (
          <script
            async
            src="https://umami.rboskind.com/script.js"
            data-website-id="c3e15d76-8b20-4ba3-ad68-2a97d7dce064"
          ></script>
        )}
      </Head>
      <Providers>
        <HeaderNav />
        <Sidebar />
        <div className="drawer h-full">
          <div className="drawer-content h-full">
            <Component {...pageProps} />
          </div>
        </div>
      </Providers>
    </main>
  );
}
