import Link from "next/link";
import React from "react";

export type Demo = {
  title: string;
  description: string;
  url: string;
};

const demoList: Demo[] = [
  {
    title: "Rock Paper Scissors",
    description: "A simple game of Rock Paper Scissors",
    url: "/demos/rockPaperScissors",
  },
  {
    title: "Color Picker Game",
    description: "A game to guess colors based on their RGB values",
    url: "/demos/colorPickerGame",
  },
];

export default function Demos() {
  return (
    <div className="flex flex-col sm:p-10 items-center justify-center">
      <h1 className="text-4xl text-base-content m-10">
        Some interesting code demos
      </h1>
      <h2 className="text-2xl text-base-content m-10">
        This is a small collection of interesting little side projects and code
        ideas I have created. I hope you enjoy them!
      </h2>
      <div className="shadow-lg w-full py-2 sm:p-14 sm:rounded-md flex flex-col items-center sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gradient-to-br from-green-200 via-green-400 to-blue-500 ">
        {demoList.map((demo) => (
          <div className="card shadow-lg  text-base-content glass w-80">
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
        ))}
      </div>
    </div>
  );
}
