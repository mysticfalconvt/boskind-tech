import "./globals.css";
import { Fira_Code, Inter } from "next/font/google";

export const metadata = {
  title: "Vercel Postgres Demo with Prisma",
  description:
    "A simple Next.js app with Vercel Postgres as the database and Prisma as the ORM",
};

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
  return (
    <html lang="en">
      <body className={FiraCode.className}>{children}</body>
    </html>
  );
}
