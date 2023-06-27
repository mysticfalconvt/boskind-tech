import CassidooFooter from "@/components/CassidooFooter";
import React from "react";

export default function isOdious() {
  const [isOdious, setIsOdious] = React.useState(false);
  const [binaryNumber, setBinaryNumber] = React.useState(0);
  const [oneCount, setOneCount] = React.useState(0);
  const [error, setError] = React.useState("");
  const [number, setNumber] = React.useState(0);

  function checkIfOdious(numberToCheck: number) {
    // check that it is a number
    if (!numberToCheck && numberToCheck != 0) {
      setError("Not A Number");
      // if its negative it cant be odious
    } else if (numberToCheck < 0) {
      setError("Negative Number");
      //convert to binary and then check number of ones
    } else {
      setError("");
      const binaryNumber = numberToCheck >>> 0;

      const numberOfOnes = binaryNumber.toString(2).split("1").length - 1;

      const isOdious = numberOfOnes % 2 === 0 ? false : true;

      setBinaryNumber(binaryNumber);
      setOneCount(numberOfOnes);
      setIsOdious(isOdious);
    }
  }

  React.useEffect(() => {
    checkIfOdious(number);
  }, [number]);

  return (
    <div className="flex flex-col sm:p-10 items-center justify-center text-base-content">
      <h1 className="text-4xl  m-10">Is the number Odious?</h1>
      <p>
        An “odious number” is a non-negative number that has an odd number of 1s
        in its binary expansion.
      </p>
      <input
        type="number"
        id="number"
        className="input input-bordered input-primary m-4"
        onChange={(e) => setNumber(parseInt(e.target.value))}
      />

      <p>
        Is Odious: <span id="isOdious">{isOdious ? "Yes" : "No"}</span>
      </p>

      <p>
        Binary Expansion:{" "}
        <span id="binaryNumber">{binaryNumber.toString(2)}</span>
      </p>

      <p>
        Number Of Ones: <span id="oneCount">{oneCount}</span>
      </p>
      {error ? (
        <div className="badge badge-error">
          Error: <span id="error"> {error}</span>
        </div>
      ) : null}

      <CassidooFooter
        githubLink="https://github.com/mysticfalconvt/boskind-tech/blob/7d7c9b40a0df9548c06fd814edf9e714497afe42/pages/demos/isOdious.tsx"
        newsletterLink="https://buttondown.email/cassidoo/archive/we-were-together-i-forget-the-rest-walt-whitman/"
      />
    </div>
  );
}
