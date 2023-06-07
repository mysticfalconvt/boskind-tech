import React, { useState } from "react";

export default function rockPaperScissors() {
  const [player1, setPlayer1] = useState("rock");
  const [player2, setPlayer2] = useState("");
  const [result, setResult] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [Player1Wins, setPlayer1Wins] = useState(0);
  const [Player2Wins, setPlayer2Wins] = useState(0);
  //function to get the a random number between 1 and 3
  function getRandomNumber() {
    return Math.floor(Math.random() * 3) + 1;
  }
  //function get get player 2's choice
  function getPlayer2() {
    const randomNumber = getRandomNumber();
    if (randomNumber === 1) {
      setPlayer2("rock");
    } else if (randomNumber === 2) {
      setPlayer2("scissors");
    } else {
      setPlayer2("paper");
    }
  }

  //function to get the winner
  function getWinner() {
    if (player1 === "rock" && player2 === "scissors") {
      setPlayer1Wins(Player1Wins + 1);
      return "Player 1";
    } else if (player1 === "scissors" && player2 === "paper") {
      setPlayer1Wins(Player1Wins + 1);
      return "Player 1";
    } else if (player1 === "paper" && player2 === "rock") {
      setPlayer1Wins(Player1Wins + 1);
      return "Player 1";
    } else if (player2 === "rock" && player1 === "scissors") {
      setPlayer2Wins(Player1Wins + 1);
      return "Player 2";
    } else if (player2 === "scissors" && player1 === "paper") {
      setPlayer2Wins(Player1Wins + 1);
      return "Player 2";
    } else if (player2 === "paper" && player1 === "rock") {
      setPlayer2Wins(Player1Wins + 1);
      return "Player 2";
    } else if (player2 === "") {
      return "";
    } else {
      return "Nobody";
    }
  }

  return (
    <div className="p-5 flex flex-col items-center text-base-content">
      <h1 className="text-5xl">Rock Paper Scissors</h1>
      <h2 className="text-2xl">{result ? `${result} wins!` : "New Game"}</h2>
      <div className="join">
        <button
          className="btn btn-accent text-accent-content join-item"
          disabled={!!player2}
          onClick={() => setPlayer1("rock")}
        >
          Rock
        </button>
        <button
          className="btn btn-accent text-accent-content join-item"
          disabled={!!player2}
          onClick={() => setPlayer1("paper")}
        >
          Paper
        </button>
        <button
          className="btn btn-accent text-accent-content join-item"
          disabled={!!player2}
          onClick={() => setPlayer1("scissors")}
        >
          Scissors
        </button>
      </div>
      <p>Player 1: {player1}</p>
      <p>Player 2: {player2}</p>
      <button
        className="btn btn-accent text-accent-content"
        disabled={!!player2}
        style={{ margin: "5px" }}
        onClick={() => {
          getPlayer2();
        }}
      >
        Player 2{" "}
      </button>
      <button
        className="btn btn-secondary text-secondary-content"
        disabled={!!gameOver || !player2}
        style={{ margin: "5px" }}
        onClick={() => {
          setResult(getWinner());
          setGameOver(true);
        }}
      >
        Who Won?
      </button>
      <button
        className="btn btn-primary text-primary-content"
        disabled={!gameOver}
        style={{ margin: "5px" }}
        onClick={() => {
          setPlayer2("");
          setResult("");
          setGameOver(false);
        }}
      >
        New Game
      </button>

      <p>Player 1 Wins: {Player1Wins}</p>
      <p>Player 2 Wins: {Player2Wins}</p>
    </div>
  );
}
