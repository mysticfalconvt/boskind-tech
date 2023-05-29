import { copy } from "@/lib/copy";
import React from "react";

export default function page() {
  return (
    <div className="flex flex-col items-center justify-center text-base-content">
      <h1 className="text-5xl m-5">{copy.components.webdev.title}</h1>
      <div className=" prose ">{copy.components.webdev.copy}</div>
    </div>
  );
}
