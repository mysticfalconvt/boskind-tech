import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import Table from "@/components/table";
import TablePlaceholder from "@/components/table-placeholder";
import ExpandingArrow from "@/components/expanding-arrow";

// Prisma does not support Edge without the Data Proxy currently
// export const runtime = 'edge'
export const preferredRegion = "home";
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className=" flex min-h-screen flex-col items-center justify-center bg-base-100">
      <div>
        <h1 className="text-4xl font-bold text-center text-primary">
          Welcome to Boskind Digital
        </h1>
      </div>
    </main>
  );
}
