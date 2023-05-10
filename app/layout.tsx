"use client";
import "./globals.css";
import { Fira_Code } from "next/font/google";
import { useLocalStorage } from "@mantine/hooks";
import { HeaderNav } from "@/components/HeaderNav";
import React from "react";
import { QueryClient, QueryClientProvider } from "react-query";

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

  return (
    <QueryClientProvider client={queryClient}>
      <html lang="en" data-theme={themeStorage}>
        <body className={FiraCode.className}>
          <HeaderNav theme={themeStorage} toggleTheme={handleThemeChange} />

          {children}
        </body>
      </html>
    </QueryClientProvider>
  );
}
