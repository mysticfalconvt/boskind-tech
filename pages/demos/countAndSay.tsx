import React from "react";
import CassidooFooter from "@/components/CassidooFooter";

const NumberNames: Record<string, string> = {
  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
};

const getCountAndSay = (number: string, groupAndSort: boolean) => {
  // check that the number is a valid number
  if (number === "") return "Please enter a number";

  let characterArray = number.split("");
  //   check if the array contains only numbers
  if (characterArray.some((char) => isNaN(parseInt(char)))) {
    return "Please enter only numbers";
  }
  if (groupAndSort) {
    characterArray = characterArray.sort();
  }

  //   break out the array into groups of numbers
  const groupedArray = characterArray.reduce((acc, char) => {
    if (acc.length === 0) {
      acc.push([char]);
    } else {
      const lastGroup = acc[acc.length - 1];
      if (lastGroup[0] === char) {
        lastGroup.push(char);
      } else {
        acc.push([char]);
      }
    }
    return acc;
  }, [] as string[][]);

  const groupText = groupedArray.map((group) => {
    const numberName = NumberNames[group[0]];
    return `${group.length} ${numberName}${group.length > 1 ? "s" : ""}`;
  });

  return groupText.join(", ");
};

export default function countAndSay() {
  const [numberString, setNumberString] = React.useState("1223334444");
  const [groupAndSort, setGroupAndSort] = React.useState(false);

  return (
    <div className="flex flex-col sm:p-10 items-center justify-center text-base-content">
      <h1 className="text-4xl  m-10">Count and Say</h1>
      <h2 className="text-2xl  m-10">
        Given a sequence of numbers, generate a "count and say" string.
      </h2>
      <label className="cursor-pointer label">
        <span className="label-text">Group and sort the values</span>
        <input
          type="checkbox"
          className="toggle toggle-primary ml-2"
          checked={groupAndSort}
          onChange={(e) => setGroupAndSort(e.target.checked)}
        />
      </label>
      <input
        type="text"
        className="input input-bordered w-full max-w-xs"
        value={numberString}
        onChange={(e) => setNumberString(e.target.value)}
      />
      <h2 className="text-2xl  m-10">
        {getCountAndSay(numberString, groupAndSort)}
      </h2>

      <CassidooFooter
        newsletterLink="https://buttondown.email/cassidoo/archive/a-ship-in-port-is-safe-but-thats-not-what-ships/"
        githubLink="https://github.com/mysticfalconvt/boskind-tech/blob/main/pages/demos/countAndSay.tsx"
      />
    </div>
  );
}
