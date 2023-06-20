import Link from "next/link";
import React from "react";
import { Demo } from "../pages/demos";

export function DemoCard({ demo }: { demo: Demo }): React.JSX.Element {
  return (
    <div className="card shadow-lg  text-base-content glass w-full">
      <div className="card-body">
        <h2 className="card-title font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-slate-500 to-orange-600">
          {demo.title}
        </h2>
        <p className=" text-transparent bg-clip-text bg-gradient-to-br from-slate-500 to-orange-600">
          {demo.description}
        </p>
        <Link
          href={demo.url}
          className="btn btn-accent opacity-70 text-yellow-50 mt-4"
        >
          View Demo
        </Link>
      </div>
    </div>
  );
}
