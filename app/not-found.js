"use client";
import React from "react";

export default function NotFound() {
  console.log("not found");

  // redirect to home page
  React.useEffect(() => {
    if (window) {
      window.location.href = "/";
    }
  }, []);
  return <div>not-found</div>;
}
