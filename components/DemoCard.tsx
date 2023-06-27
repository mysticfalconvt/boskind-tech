import Link from "next/link";
import React from "react";
import { Demo } from "../pages/demos";

export function DemoCard({
  demo,
  isCassidoo,
}: {
  demo: Demo;
  isCassidoo: boolean;
}): React.JSX.Element {
  return (
    <div className="card shadow-lg bg-base-300 text-base-content glass h-full w-full">
      <div className="card-body">
        <h2 className="card-title font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-info to-accent">
          {demo.title}
        </h2>
        <p className=" text-transparent bg-clip-text bg-gradient-to-br from-info to-accent">
          {demo.description}
        </p>
        <Link
          href={demo.url}
          className="btn btn-accent opacity-70 text-yellow-50 mt-4"
        >
          View Demo
          {isCassidoo && (
            <span className="badge badge-outline badge-alert ml-2 text-sm">
              Cassidoo
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
