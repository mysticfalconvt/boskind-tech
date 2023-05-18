import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import Table from "@/components/table";
import TablePlaceholder from "@/components/table-placeholder";
import ExpandingArrow from "@/components/expanding-arrow";
import { copy } from "@/lib/copy";
import TextTyper from "@/components/TextTyper";

// Prisma does not support Edge without the Data Proxy currently
// export const runtime = 'edge'
export const preferredRegion = "home";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Boskind Digital",
  description: "Boskind Digital LLC",
  icons: {
    icon: "public/favicon.ico",
  },
};

export default function Home() {
  return (
    <main className="flex  flex-col items-center justify-start ">
      <h1 className="text-4xl sm:text-5xl lg:text-8xl font-bold text-center text-primary m-5 md:m-10 lg:m-16">
        {copy.components.BoskindDigital.welcome}
      </h1>
      <TextTyper text={copy.components.BoskindDigital.copy} />
    </main>
  );
}
