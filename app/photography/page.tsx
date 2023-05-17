import React from "react";

export default function page() {
  return (
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-xl">Photography</h1>
      <div className=" prose ">
        You can find current work at{" "}
        <a className="link link-primary" href="https://nekpics.com">
          NEK Pics
        </a>
      </div>
    </div>
  );
}
