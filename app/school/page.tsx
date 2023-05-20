import Loading from "@/components/Loading";
import Table from "@/components/table";
import { copy } from "@/lib/copy";
import React, { Suspense } from "react";

export default function page() {
  return (
    <div className="flex flex-col items-center justify-center text-base-content">
      <h1 className="text-5xl m-5">{copy.components.school.title}</h1>
      <div className=" prose ">{copy.components.school.copy}</div>
      {/* <Suspense fallback={<Loading />}> */}
      {/* @ts-expect-error Async Server Component */}
      {/* <Table /> */}
      {/* </Suspense> */}
    </div>
  );
}
