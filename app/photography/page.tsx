import React from "react";

export default function page() {
  return (
    <div className="flex flex-col items-center justify-center text-base-content">
      <h1 className="text-5xl m-5">Photography</h1>
      <div className=" prose ">
        You can find current work at{" "}
        <a className="link link-primary-content" href="https://nekpics.com">
          NEK Pics
        </a>
      </div>
    </div>
  );
}
