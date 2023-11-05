import CassidooFooter from "@/components/CassidooFooter";
import React from "react";

const isIsomorphic = (stringA: string, stringB: string) => {
  stringA = stringA.toLowerCase();
  stringB = stringB.toLowerCase();
  if (stringA.length !== stringB.length) {
    return false;
  }
  const map = stringA.split("").map((char, index) => {
    return { str1Char: char, str2Char: stringB[index] };
  });

  let mappingsArray: [string, string][] = [];
  let inValid = false;
  map.forEach((char) => {
    const found = mappingsArray.find((mapping) => mapping[0] === char.str1Char);
    const found2 = mappingsArray.find(
      (mapping) => mapping[1] === char.str2Char
    );
    if (found) {
      if (found[1] !== char.str2Char) {
        inValid = true;
        return false;
      }
    } else {
      if (found2) {
        if (found2[0] !== char.str1Char) {
          inValid = true;
          return false;
        }
      }
      mappingsArray.push([char.str1Char, char.str2Char]);
    }
  });
  return !inValid;
};

export default function () {
  const [stringA, setStringA] = React.useState("");
  const [stringB, setStringB] = React.useState("");

  return (
    <div className="flex flex-col sm:p-10 items-center justify-center text-base-content">
      <h1 className="text-4xl  m-10">Are these two strings isomorphic?</h1>
      <p>
        Given two strings s and t, determine if they are isomorphic. Two strings
        are isomorphic if there is a one-to-one mapping possible for every
        character of the first string to every character of the second string.
      </p>
      <div className="flex flex-col sm:flex-row justify-center items-center">
        <input
          className="input input-bordered input-primary m-4"
          onChange={(e) => setStringA(e.target.value)}
        />
        <input
          className="input input-bordered input-primary m-4"
          onChange={(e) => setStringB(e.target.value)}
        />
      </div>
      <div>
        {isIsomorphic(stringA, stringB) ? (
          <div className="bg-green-200 flex items-center justify-center h-10 w-20 rounded-md">
            <p>Yes</p>
          </div>
        ) : (
          <div className="bg-red-200 flex items-center justify-center h-10 w-20 rounded-md">
            <p>No</p>
          </div>
        )}
      </div>
      <CassidooFooter
        newsletterLink="https://buttondown.email/cassidoo/archive/no-matter-what-people-tell-you-words-and-ideas/"
        githubLink="https://github.com/mysticfalconvt/boskind-tech/blob/main/pages/demos/isIsomorphic.tsx"
      />
    </div>
  );
}
