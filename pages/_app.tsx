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
  return (
    <main
      className={`${FiraCode.className} bg-gradient-to-br from-base-100 to-base-300 min-h-screen`}
    >
      <Head>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <meta name="author" content={metadata.creator} />
        <meta name="abstract" content={metadata.abstract} />
        <meta name="category" content={metadata.category} />
        <link rel="icon" type="image/png" href={metadata.icons.icon} />
        <link rel="shortcut icon" href={metadata.icons.icon} />
      </Head>
      <Providers>
        <HeaderNav />
        <Sidebar />
        <div className="drawer h-full">
          <div className="drawer-content ">
            <Component {...pageProps} />
          </div>
        </div>
      </Providers>
    </main>
  );
}
