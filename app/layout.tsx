"use client";
import "./globals.css";
import { Fira_Code } from "next/font/google";
import { useToggle } from "@mantine/hooks";

const FiraCode = Fira_Code({
  subsets: ["latin"],
  display: "swap",
  style: "normal",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeValue, toggle] = useToggle(["cupcake", "dark"]);

  return (
    <html lang="en" data-theme={themeValue}>
      <body className={FiraCode.className}>
        <button
          onClick={() => {
            toggle();
          }}
        >
          Toggle Theme
        </button>
        {children}
      </body>
    </html>
  );
}
