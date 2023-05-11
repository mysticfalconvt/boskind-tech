import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import Table from "@/components/table";
import TablePlaceholder from "@/components/table-placeholder";
import ExpandingArrow from "@/components/expanding-arrow";
import { copy } from "@/lib/copy";

// Prisma does not support Edge without the Data Proxy currently
// export const runtime = 'edge'
export const preferredRegion = "home";
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className=" flex min-h-screen flex-col items-center justify-start bg-base-100">
      <div>
        <h1 className="text-4xl font-bold text-center text-primary m-5">
          {copy.components.BoskindDigital.welcome}
        </h1>
        <h2 className="text-2xl font-bold text-center text-accent m-5">
          {copy.components.BoskindDigital.copy}
        </h2>
      </div>
    </main>
  );
}
