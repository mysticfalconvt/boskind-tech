import CassidooFooter from "@/components/CassidooFooter";
import React from "react";

enum gameStatus {
  IN_PROGRESS,
  WON,
  LOST,
}

export default function guessANumber() {
  const [numberOfGuesses, setNumberOfGuesses] = React.useState(0);
  const [guess, setGuess] = React.useState(0);
  const [range, setRange] = React.useState(100);
  const [message, setMessage] = React.useState("");
  const [number, setNumber] = React.useState(Math.floor(Math.random() * range));
  const [gameState, setGameState] = React.useState(gameStatus.IN_PROGRESS);

  const handleGuess = () => {
    if (guess === number) {
      setMessage("You guessed it!");
      setGameState(gameStatus.WON);
    }
    if (guess > number) {
      setMessage("Too high!");
    }
    if (guess < number) {
      setMessage("Too low!");
    }

    if (gameState === gameStatus.IN_PROGRESS) {
      if (numberOfGuesses === 9) {
        setNumberOfGuesses(10);
        setGameState(gameStatus.LOST);
      }
      setNumberOfGuesses(numberOfGuesses + 1);
    }
  };

  const handleUpdateRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    setRange(parseInt(target.value) || 0);
    setNumber(Math.floor(Math.random() * range));
    setNumberOfGuesses(0);
    setGuess(0);
    setMessage("");
  };

  return (
    <div className="flex flex-col sm:p-10 items-center justify-center text-base-content">
      <h1 className="text-4xl  m-10">Guess a number between 0 and {range}</h1>
      {gameState === gameStatus.WON ? (
        <div className="card w-96 bg-primary text-primary-content absolute z-20 ">
          <div className="card-body">
            <h2 className="card-title">
              You Won!!! in {numberOfGuesses} tries
            </h2>
            <p>If a dog chews shoes whose shoes does he choose?</p>
            <div className="card-actions justify-end">
              <button
                className="btn"
                onClick={() => {
                  setGameState(gameStatus.IN_PROGRESS);
                  setNumber(Math.floor(Math.random() * range));
                  setNumberOfGuesses(0);
                  setGuess(0);
                }}
              >
                Start a new game
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {gameState === gameStatus.LOST ? (
        <div className="card w-96 bg-primary text-primary-content absolute z-20 ">
          <div className="card-body">
            <h2 className="card-title">You Lost!!!</h2>
            <p>Why did the chicken cross the road?</p>
            <div className="card-actions justify-end">
              <button
                className="btn"
                onClick={() => {
                  setGameState(gameStatus.IN_PROGRESS);
                  setNumber(Math.floor(Math.random() * range));
                  setNumberOfGuesses(0);
                  setGuess(0);
                }}
              >
                Start a new game
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <input
        type="range"
        min={0}
        max="1000"
        value={range}
        className="range range-info max-w-lg"
        onChange={handleUpdateRange}
      />
      <input
        type="number"
        className="input input-bordered input-primary m-4"
        value={guess}
        onChange={(e) => setGuess(parseInt(e.target.value) || 0)}
        max={range}
        min={0}
      />
      <div
        className="radial-progress bg-primary text-primary-content border-4 border-primary"
        style={{ "--value": `${numberOfGuesses * 10}` } as any}
      >
        {numberOfGuesses}
      </div>
      <button className="btn btn-primary m-4" onClick={handleGuess}>
        Guess
      </button>
      <p>{message}</p>
      <p>Number of guesses: {numberOfGuesses}</p>
      <CassidooFooter
        newsletterLink="https://buttondown.email/cassidoo/archive/not-everything-that-is-faced-can-be-changed-but-1047/"
        githubLink="https://github.com/mysticfalconvt/boskind-tech/blob/main/pages/demos/guessANumber.tsx"
      />
    </div>
  );
}
