"use client";
import { useViewportSize } from "@mantine/hooks";
// component to display text with typing animation

import { useState, useEffect } from "react";

export default function TextTyper({ text }: { text: string }) {
  const [textToDisplay, setTextToDisplay] = useState("");
  const [index, setIndex] = useState(0);
  const characterCount = text.length;
  useEffect(() => {
    if (index < characterCount) {
      const timeout = Math.random() * 100;
      setTimeout(() => {
        setTextToDisplay(textToDisplay + text[index]);
        setIndex(index + 1);
      }, timeout);
    }
  }, [characterCount, index, text, textToDisplay]);
  const { width } = useViewportSize();
  const charactersPerLine = width / 14;

  // split every linesOfText into a separate line
  const wordArray = textToDisplay.split(" ");
  // create array of words with max length of charactersPerLine
  const linesOfTextArray: string[] = [];
  wordArray.forEach((word) => {
    if (linesOfTextArray.length === 0) {
      linesOfTextArray.push(word);
    } else {
      const lastLine = linesOfTextArray[linesOfTextArray.length - 1];
      if (lastLine.length + word.length + 1 > charactersPerLine) {
        linesOfTextArray.push(word);
      } else {
        linesOfTextArray[linesOfTextArray.length - 1] += " " + word;
      }
    }
  });

  console.log(linesOfTextArray);
  return (
    <div className="h-fit w-screen px-3">
      <div className="mockup-code h-full w-full m-auto md:w-10/12">
        <pre data-prefix=">">
          <code>{linesOfTextArray[0]}</code>
        </pre>
        {linesOfTextArray.slice(1).map((line) => {
          return (
            <pre key={line} data-prefix="">
              <code>{line}</code>
            </pre>
          );
        })}
      </div>
    </div>
  );
}
