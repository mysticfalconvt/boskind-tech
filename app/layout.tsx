"use client";
import "./globals.css";
import { Fira_Code } from "next/font/google";
import { useDisclosure, useLocalStorage } from "@mantine/hooks";
import { HeaderNav } from "@/components/HeaderNav";
import React, { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "react-query";
import { headerLinks } from "@/lib/links";
import Link from "next/link";

const FiraCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  style: "normal",
});

// export const metadata = {
//   title: "Boskind Digital",
//   description: "Boskind Digital LLC",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = new QueryClient();
  const [themeStorage, setTheme] = useLocalStorage({
    key: "theme",
    defaultValue: "winter",
  });
  const handleThemeChange = () => {
    setTheme(themeStorage === "winter" ? "dark" : "winter");
  };
  const [isMenuOpen, toggleMenu] = useDisclosure(false);
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  useEffect(() => {
    if (width > 650) {
      toggleMenu.close();
    }
  }, [width, toggleMenu]);

  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en" data-theme={themeStorage}>
        <body className={FiraCode.className}>
          <HeaderNav
            theme={themeStorage}
            toggleTheme={handleThemeChange}
            menuStatus={isMenuOpen}
            toggleMenu={toggleMenu.toggle}
          />
          <div className="drawer">
            <input
              id="my-drawer"
              type="checkbox"
              className="drawer-toggle"
              checked={isMenuOpen}
              onChange={toggleMenu.toggle}
            />

            <div className="drawer-content">{children}</div>
            <div className="drawer-side">
              <label htmlFor="my-drawer" className="drawer-overlay"></label>
              <ul className="menu p-4 w-100 bg-base-100 text-base-content">
                {
                  <ul className="menu p-4 w-80 bg-base-100 text-base-content">
                    {headerLinks.map((link) => {
                      if (link.subItems) {
                        return (
                          <li key={`sidenav${link.label}${link.href}`}>
                            {link.icon ? <link.icon /> : null}
                            {link.label}
                            <ul className="menu p-4 w-80 bg-base-100 text-base-content">
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
      </html>
    </QueryClientProvider>
  );
}
