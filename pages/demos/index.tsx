import React from "react";
import { DemoCard } from "../../components/DemoCard";
import fs from "fs";
import { GetStaticProps } from "next";

export type Demo = {
  title: string;
  description: string;
  url: string;
};

export const demoList: Demo[] = [
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
  {
    title: "Guess a number",
    description: "A simple game to guess a number in a range",
    url: "/demos/guessANumber",
  },
  {
    title: "Count and Say",
    description: "Generate a count and say string from a sequence of numbers",
    url: "/demos/countAndSay",
  },
  {
    title: "Fizz Buzz",
    description: "Simple Fizz-Buzz... the obvious programming question",
    url: "/demos/fizzBuzz",
  },
  {
    title: "Odious numbers",
    description:
      " An 'odious number' is a non-negative number that has an odd number of 1s in its binary expansion.",
    url: "/demos/isOdious",
  },
  {
    title: "Factorial Zeros",
    description:
      "How many zeros does the factorial of a number have? This is a simple algorithm to find out.",
    url: "/demos/factorialZeros",
  },
  {
    title: "Student Projects",
    description: "Here are some of the projects my students have created. ",
    url: "/demos/studentProjects",
  },
  {
    title: "JSON Depth Calculator",
    description:
      "This is a simple algorithm to calculate the depth of a JSON object",
    url: "/demos/jsonDepth",
  },
  {
    title: "Missing Letters",
    description:
      "This is an algorithm to find the missing letters in a list of consecutive letters ",
    url: "/demos/consecutiveLetters",
  },
  {
    title: "Reversed Squares",
    description:
      "This is an algorithm to find if a number is botha  square number, and the reverse of a square number",
    url: "/demos/reversedSquare",
  },
  {
    title: "Pokemon",
    description:
      "Using the pokemon API to find out what a pokemon is strong and weak against",
    url: "/demos/pokemon",
  },
];

export default function Demos({ CassidooFiles }: { CassidooFiles: string[] }) {
  console.log(CassidooFiles);
  return (
    <div className="flex flex-col sm:p-10 items-center justify-center">
      <h1 className="text-4xl text-base-content m-10">
        Some interesting code demos
      </h1>
      <h2 className="text-2xl text-base-content m-10">
        This is a small collection of interesting little side projects and code
        ideas I have created. I hope you enjoy them!
      </h2>
      <div className="shadow-lg w-full py-8 sm:p-14 sm:rounded-md flex flex-col items-center sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-gradient-to-br from-green-200 via-green-400 to-blue-500 ">
        {demoList.map((demo) => (
          <DemoCard
            key={demo.title}
            demo={demo}
            isCassidoo={CassidooFiles.includes(demo.url.split("/")[2])}
          />
        ))}
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  // get all files in this dir
  const files = fs
    .readdirSync("pages/demos")
    .filter((file) => file !== "index.tsx");

  // get the name of every file that has the componenet <CassidooFooter
  const CassidooFiles = files
    .filter((file) => {
      const fileContents = fs.readFileSync(`pages/demos/${file}`, "utf8");
      return fileContents.includes("<CassidooFooter");
    })
    .map((file) => file.replace(".tsx", ""));
  return {
    props: {
      CassidooFiles,
    },
  };
};
