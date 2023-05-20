import "./globals.css";
import { Fira_Code } from "next/font/google";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { HeaderNav } from "@/components/HeaderNav";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { headerLinks } from "@/lib/copy";
import Link from "next/link";
import Providers from "@/components/Providers";

const FiraCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  style: "normal",
});

export const metadata = {
  title: "Boskind Digital",
  description: "Boskind Digital LLC - Web Development and Consulting Services",

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
      <Providers>
        <body
          className={` ${FiraCode.className} bg-gradient-to-br from-base-100 to-neutral `}
        >
          <HeaderNav />
          <div className="drawer">
            {/* <input
              id="my-drawer"
              type="checkbox"
              className="drawer-toggle"
              checked={isMenuOpen}
              onChange={toggleMenu.toggle}
            /> */}

            <div className="drawer-content">{children}</div>
            <div className="drawer-side md:hidden">
              <label
                htmlFor="my-drawer"
                className="drawer-overlay md:hidden"
              ></label>
              <ul className="menu p-4 w-100 bg-base-100 text-base-content md:hidden">
                {
                  <ul className=" p-4 w-80 bg-base-100 ">
                    {headerLinks.map((link) => {
                      if (link.subItems) {
                        return (
                          <li key={`sidenav${link.label}${link.href}`}>
                            <div className="group relative flex items-center ">
                              {link.icon ? <link.icon /> : null}
                              {link.label}
                            </div>
                            <ul className=" p-4 pt-0 w-70 bg-base-100 ">
                              {link.subItems.map((subItem) => (
                                <li
                                  key={`sidenav${subItem.label}${subItem.href}`}
                                >
                                  <Link href={subItem.href}>
                                    {subItem.label}
                                    {subItem.icon ? <subItem.icon /> : null}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </li>
                        );
                      } else {
                        return (
                          <li key={`sidenav${link.label}`}>
                            <Link href={link.href}>
                              {link.icon ? <link.icon /> : null}
                              {link.label}
                            </Link>
                          </li>
                        );
                      }
                    })}
                  </ul>
                }
              </ul>
            </div>
          </div>
        </body>
      </Providers>
    </html>
  );
}
