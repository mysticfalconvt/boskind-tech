"use client";
import React from "react";

export default function Loading() {
  const [loadingNumber, setLoadingNumber] = React.useState(0);
  const [upOrDown, setUpOrDown] = React.useState(true);
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (loadingNumber === 100) {
        setUpOrDown(false);
      }
      if (loadingNumber === 0) {
        setUpOrDown(true);
      }
      if (upOrDown) {
        setLoadingNumber(loadingNumber + 1);
      } else {
        setLoadingNumber(loadingNumber - 1);
      }
    }, 5);
    return () => clearInterval(interval);
  }, [loadingNumber, upOrDown]);

  return (
    <div
      className="radial-progress bg-gradient-to-tl from-primary to-secondary text-accent opacity-70 text-opacity-90 m-5"
      style={{ "--value": loadingNumber } as React.CSSProperties}
    >
      <div
        className="radial-progress  text-accent opacity-70 text-opacity-90 m-5"
        style={
          {
            "--value": 100 - loadingNumber,
            "--size": "4rem",
            "--thickness": "10px",
          } as React.CSSProperties
        }
      >
        <div
          className="radial-progress  text-accent opacity-70 text-opacity-90 m-5"
          style={
            {
              "--value": loadingNumber,
              "--size": "2.8rem",
              "--thickness": "10px",
            } as React.CSSProperties
          }
        >
          <div
            className="radial-progress  text-accent opacity-90 text-opacity-90 m-5"
            style={
              {
                "--value": 100 - loadingNumber,
                "--size": "1.6rem",
                "--thickness": "8px",
              } as React.CSSProperties
            }
          ></div>
        </div>
      </div>
    </div>
  );
}
