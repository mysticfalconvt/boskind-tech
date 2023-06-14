import React, { use } from "react";

export default function factorialZeros() {
  const [number, setNumber] = React.useState(0);
  const [numberOfZeros, setNumberOfZeros] = React.useState(0);

  function calcFactorialZeros() {
    if (number === 0) {
      setNumberOfZeros(0);
      return;
    }
    const numberOfZeros = divideByFive(number, 0);
    setNumberOfZeros(numberOfZeros);
  }

  function divideByFive(valueToDivide: number, total: number): number {
    const newValueToDivide = valueToDivide / 5;
    const amountToAdd = Math.floor(newValueToDivide);

    if (newValueToDivide < 1) {
      return total;
    }
    const newTotal = divideByFive(newValueToDivide, total + amountToAdd);
    return newTotal;
  }

  React.useEffect(() => {
    calcFactorialZeros();
  }, [number]);

  return (
    <div className="flex flex-col sm:p-10 items-center justify-center text-base-content">
      <h1 className="text-4xl  m-10">
        How many zeros does the factorial of a number have?
      </h1>
      <input
        type="number"
        className="input input-bordered input-primary m-4"
        value={number}
        onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
      />
      <p>
        Trailing Zeros: <a id="zeros">{numberOfZeros}</a>
      </p>
    </div>
  );
}
