import "./globals.css";
import { Fira_Code } from "next/font/google";
import { HeaderNav } from "@/components/HeaderNav";
import React from "react";
import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";

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
    icon: "public/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body
        className={` ${FiraCode.className} bg-gradient-to-br from-base-100 to-neutral `}
      >
        <Providers>
          <HeaderNav />
          <Sidebar />
          <div className="drawer">
            <div className="drawer-content">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
