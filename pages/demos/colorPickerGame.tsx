import { colorPickerStore } from "@/stateHooks/colorPickerGameStore";
import * as React from "react";

export default function ColorGame() {
  const {
    colorTiles,
    checkColor,
    startNewGame,
    isGameOver,
    isNewGame,
    gameLevel,
    winningColor,
    setGameLevel,
    averageScore,
  } = colorPickerStore();
  const [onClient, setOnClient] = React.useState(false);

  const [rotatingColor, setRotatingColor] = React.useState([
    "rgb(255, 255, 255)",
  ]);
  const [colorIndex, setColorIndex] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setColorIndex((colorIndex + 1) % rotatingColor.length);
    }, 600);
    return () => clearInterval(interval);
  }, [colorIndex, rotatingColor]);

  React.useEffect(() => {
    setOnClient(true);
    setRotatingColor(colorTiles.map((color) => color.color));
  }, []);

  React.useEffect(() => {
    if (isNewGame) {
      setRotatingColor(colorTiles.map((color) => color.color));
    }
  }, [isNewGame]);

  if (!onClient) return null;

  const winningColorBG = colorTiles.filter((color) => color.isCorrect)[0].color;

  return (
    <div className="flex flex-col content-around w-full items-center text-base-content">
      <h1 className="headerTitle text-3xl m-3 text-center ">
        The Great
        <span
          className="text-4xl px-2"
          style={{ color: rotatingColor[colorIndex] }}
        >
          RGB
        </span>
        Color Game
      </h1>
      <h2 className="text-3xl m-2">RGB Values: {winningColor()}</h2>

      <div className="form-control rounded-md border-2 m-4 border-accent">
        <label className="label cursor-pointer">
          <span className="label-text text-accent pr-5">Challenge Mode</span>
          <input
            type="range"
            min="3"
            max="12"
            step={3}
            value={gameLevel}
            className="range range-success"
            onChange={(e) => setGameLevel(parseInt(e.target.value))}
          />
        </label>
      </div>
      <div className="flex flex-col items-center justify-center w-full">
        {isGameOver && (
          <div
            style={{ backgroundColor: winningColorBG }}
            className="absolute flex flex-col items-center justify-center alert alert-info z-20 w-2/3 border-2 border-primary-focus"
          >
            <div className="bg-info px-2 rounded-lg">
              You Won!!!!{" "}
              <button
                className={
                  "btn btn-primary m-3 text-primary-content shadow-sm disabled:btn-neutral shadow-primary-focus hover:shadow-md hover:shadow-primary"
                }
                disabled={!isGameOver}
                onClick={startNewGame}
              >
                New Game
              </button>
            </div>
          </div>
        )}
        <div className="grid grid-cols-3 gap-2 items-stretch justify-stretch w-3/4">
          {colorTiles.map((colorTile, index) => (
            <div
              key={colorTile.color + index}
              className="rounded-lg aspect-video flex items-center justify-center"
              style={{ backgroundColor: colorTile.color }}
              onClick={() => {
                if (!isGameOver) {
                  checkColor(index);
                }
              }}
            >
              {colorTile.isClicked ? (
                <>
                  <div className="flex flex-col items-center justify-center w-3/4 h-3/4 z-10 bg-black opacity-50 rounded-full"></div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-3xl m-2">
          Average Score: {Math.floor(averageScore * 100) / 100}
        </h2>
      </div>
    </div>
  );
}
