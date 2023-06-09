import { copy } from "@/lib/copy";
import React from "react";
import { HiOutlineMailOpen } from "react-icons/hi";

export default function page() {
  return (
    <div className="flex flex-col items-center justify-center text-base-content">
      <div className="hero min-h-screen bg-base-300">
        <div className="hero-content flex-col lg:flex-row border-r-4 glass m-2 rounded-md max-w-6xl">
          <img
            src="/images/NorthCountryCool.png"
            className="max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg rounded-lg shadow-2xl"
          />
          <div>
            <h1 className="text-5xl font-bold">
              {copy.components.webdev.title}
            </h1>
            <h2 className="text-3xl font-bold">
              {copy.components.webdev.subTitle}
            </h2>
            <p className="py-6">{copy.components.webdev.description}</p>
            <button className="btn btn-primary text-primary-content shadow-sm shadow-primary-focus hover:shadow-md hover:shadow-primary">
              <a href="mailto:rob@boskind.tech" className="flex">
                <HiOutlineMailOpen className="mr-2" />
                {copy.components.webdev.contact}
              </a>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
