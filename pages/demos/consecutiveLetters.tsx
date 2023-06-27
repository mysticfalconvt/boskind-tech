import CassidooFooter from "@/components/CassidooFooter";
import { useDebouncedState } from "@mantine/hooks";
import React from "react";
const alphabet = "abcdefghijklmnopqrstuvwxyz";

const missingLetters = (str: string) => {
  const alphabetArray = alphabet.split("");
  const inputArray = str.split("");
  const missingLettersArray = [];
  const firstLetter = inputArray[0];
  const lastLetter = inputArray[inputArray.length - 1];
  const firstLetterIndex = alphabetArray.indexOf(firstLetter);
  const lastLetterIndex = alphabetArray.indexOf(lastLetter);
  const alphabetSlice = alphabetArray.slice(
    firstLetterIndex,
    lastLetterIndex + 1
  );

  for (let i = 0; i < alphabetSlice.length; i++) {
    if (!inputArray.includes(alphabetSlice[i])) {
      missingLettersArray.push(alphabetSlice[i]);
    }
  }
  return missingLettersArray;
};

const isLetterLaterInAlphabet = (letter1: string, letter2: string) => {
  const alphabetArray = alphabet.split("");
  const letter1Index = alphabetArray.indexOf(letter1);
  const letter2Index = alphabetArray.indexOf(letter2);
  return letter2Index > letter1Index;
};

const getErrorMessage = (input: string) => {
  const inputArray = input.split("");

  // check for empty string
  if (input === "") {
    return "Please enter a string of letters";
  }
  // check for non-letters
  if (!/^[a-zA-Z]+$/.test(input)) {
    return "Please enter only letters";
  }
  // check for multiple letters
  if (input.length < 2) {
    return "Please enter at least two letters";
  }
  // check for duplicate letters
  const hasDuplicateLetters = inputArray.some((letter, index) => {
    return inputArray.indexOf(letter) !== index;
  });
  if (hasDuplicateLetters) {
    return "Please enter only unique letters";
  }

  // check that each consecutive letter is later in the alphabet than the previous letter
  let hasBadOrder = false;
  inputArray.forEach((letter, index) => {
    if (index > 0) {
      if (!isLetterLaterInAlphabet(inputArray[index - 1], letter)) {
        hasBadOrder = true;
      }
    }
  });
  if (hasBadOrder) {
    return "Please enter consecutive letters";
  }

  return "";
};

export default function consecutiveLetters() {
  const [input, setInput] = React.useState("");
  const [errorMessage, setErrorMessage] = useDebouncedState("", 200);
  const [output, setOutput] = useDebouncedState(missingLetters(input), 200);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setErrorMessage(getErrorMessage(e.target.value));
    setOutput(missingLetters(e.target.value));
  };

  return (
    <div className="flex flex-col h-full items-center justify-center text-base-content">
      <h1 className="text-5xl m-5">Missing Consecutive Letters</h1>
      <p className="prose">
        This is an algorithm that will fill in all of the missing letters in a
        list of consecutive letters. For example, if the input is "abce", the
        output will be ["d"]. if the input is "abcdefghjklmnoquvwz", the output
        should be ["i", "p", "r", "s", "t", "x", "y"].
      </p>
      <input
        className="input input-bordered w-96 m-2"
        type="text"
        placeholder="Enter a string of letters"
        value={input}
        onChange={handleInput}
      />
      <div className="flex flex-col w-96 h-60">
        <div className="chat chat-start">
          <div className="chat-bubble chat-bubble-primary">Input: {input}</div>
        </div>
        <div className="chat chat-end">
          {errorMessage ? (
            <div className="chat-bubble chat-bubble-warning">
              {errorMessage}
            </div>
          ) : (
            <div className="chat-bubble chat-bubble-success">
              Output: {output ? output.join(", ") : "none"}
            </div>
          )}
        </div>
      </div>
      <CassidooFooter
        newsletterLink="https://buttondown.email/cassidoo/archive/change-is-a-stranger-you-have-yet-to-know-george/"
        githubLink="https://github.com/mysticfalconvt/boskind-tech/blob/main/pages/demos/consecutiveLetters.tsx"
      />
    </div>
  );
}
