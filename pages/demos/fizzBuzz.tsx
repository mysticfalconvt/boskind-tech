import * as React from "react";

function isFizzBuzz(number: number, fizz: number = 3, buzz: number = 5) {
  let output = "";
  if (number % fizz === 0) {
    output += "Fizz";
  }
  if (number % buzz === 0) {
    output += "Buzz";
  }
  if (output === "") {
    output = number.toString();
  }
  return output;
}

export default function fizzBuzz() {
  const [fizz, setFizz] = React.useState(3);
  const [buzz, setBuzz] = React.useState(5);
  const [max, setMax] = React.useState(100);

  const fizzBuzzList = Array.from(Array(max).keys()).map((number) => {
    return isFizzBuzz(number + 1, fizz, buzz);
  });

  return (
    <div className="flex flex-col content-around w-full items-center text-base-content">
      <h1 className="headerTitle text-3xl m-3 text-center ">Fizz-Buzz</h1>
      <h2 className="text-3xl m-2">Max Value: {max}</h2>
      <input
        type="range"
        min={0}
        max="500"
        value={max}
        className="range range-primary w-3/4 mb-5"
        onChange={(e) => setMax(parseInt(e.target.value))}
      />
      <div className="flex w-full p-5">
        <div className="grid h-20 p-4 flex-grow card bg-base-300 rounded-box place-items-center">
          Fizz Value {fizz}
          <input
            type="range"
            min={0}
            max="15"
            value={fizz}
            className="range range-primary"
            onChange={(e) => setFizz(parseInt(e.target.value))}
          />
        </div>
        <div className="divider divider-horizontal"></div>
        <div className="grid h-20 p-4 flex-grow card bg-base-300 rounded-box place-items-center">
          Buzz Value {buzz}
          <input
            type="range"
            min={0}
            max="15"
            value={buzz}
            className="range range-secondary"
            onChange={(e) => setBuzz(parseInt(e.target.value))}
          />
        </div>
      </div>
      {fizzBuzzList.map((fizzBuzz, index) => {
        return <div key={index}>{fizzBuzz}</div>;
      })}
    </div>
  );
}
