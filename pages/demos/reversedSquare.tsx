import CassidooFooter from "@/components/CassidooFooter";
import * as React from "react";

function isReversedSquare(n: number) {
  const reversed = Number(n.toString().split("").reverse().join(""));
  const isPerfectSquare = Math.sqrt(n) % 1 === 0;
  const isReversedPerfectSquare = Math.sqrt(reversed) % 1 === 0;
  return isPerfectSquare && isReversedPerfectSquare;
}

function generateReversedSquareList(max: number) {
  const squareList: Number[] = [];
  const reversedSquareList: Number[] = [];
  for (let i = 1; i <= max; i++) {
    const squareOfNumber = i * i;
    squareList.push(squareOfNumber);
    const reversed = Number(
      squareOfNumber.toString().split("").reverse().join("")
    );
    const isReversedSmaller = reversed <= squareOfNumber;
    if (isReversedSmaller && squareList.includes(reversed)) {
      if (!reversedSquareList.includes(reversed)) {
        reversedSquareList.push(reversed);
      }
      if (!reversedSquareList.includes(squareOfNumber)) {
        reversedSquareList.push(squareOfNumber);
      }
    }
    console.log(i, squareOfNumber, reversed, squareList, reversedSquareList);
  }
  return reversedSquareList;
}

export default function reversedSquare() {
  const [input, setInput] = React.useState("");
  const [max, setMax] = React.useState(500);

  const reversedSquareList = React.useMemo(() => {
    return generateReversedSquareList(Number(max))
      .sort((a, b) => Number(a) - Number(b))
      .join(", ");
  }, [max]);
  return (
    <div className="flex flex-col content-around w-full items-center text-base-content">
      <h1 className="headerTitle text-3xl m-3 text-center ">
        Reversed Squares
      </h1>
      <p className="prose">
        Given an integer n, return true if it's a perfect square AND when
        reversed, is still a perfect square.
      </p>
      <input
        type="number"
        className="input input-bordered m-3"
        placeholder="Enter a number"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <div className="flex flex-col w-96">
        {input && isReversedSquare(Number(input)) ? (
          <div className="alert alert-success">
            {input} is a reversed square!
          </div>
        ) : (
          <div className="alert alert-error">
            {input ? `${input} is not a reversed square` : "Enter a number"}
          </div>
        )}
      </div>
      <div className="flex flex-col w-96">
        <h2 className="text-2xl m-3">Reversed Squares List</h2>
        <input
          type="number"
          className="input input-bordered m-3"
          value={max}
          onChange={(e) => setMax(Number(e.target.value))}
        />
        <div className="flex flex-col w-96">
          <div className="alert alert-success">{reversedSquareList}</div>
        </div>
      </div>
      <CassidooFooter
        newsletterLink="https://buttondown.email/cassidoo/archive/2447/"
        githubLink="https://github.com/mysticfalconvt/boskind-tech/blob/main/pages/demos/reversedSquare.tsx"
      />
    </div>
  );
}
