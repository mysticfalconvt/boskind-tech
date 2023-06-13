import { create } from "zustand";
// all colors are in the format of "rgb(255, 255, 255)"
// each game will include 6 color ties, one of which is the winning color in a random position
// the other 5 are random colors
// the user will click on a color tile to guess the winning color
// if they switch to easy mode, there will only be 3 color tiles
type ColorTile = {
  color: string;
  isCorrect: boolean;
  isClicked: boolean;
};

type ColorPickerStore = {
  colorTiles: ColorTile[];
  isNewGame: boolean;
  isGameOver: boolean;
  gameLevel: number;
  averageScore: number;
  guessCount: number;
  gamesPlayed: number;
  winningColor: () => string;
  startNewGame: () => void;
  checkColor: (squareNumber: number) => void;
  setGameLevel: (gameLevel: number) => void;
};

const getNewRandomColor = () => {
  const r = Math.floor(Math.random() * 255);
  const g = Math.floor(Math.random() * 255);
  const b = Math.floor(Math.random() * 255);
  return `rgb(${r},${g},${b})`;
};

const getNewColorTiles = (numberOfTiles: number) => {
  const colorTiles: ColorTile[] = [];
  for (let i = 0; i < numberOfTiles; i++) {
    colorTiles.push({
      color: getNewRandomColor(),
      isCorrect: false,
      isClicked: false,
    });
  }
  const winningColorIndex = Math.floor(Math.random() * numberOfTiles);
  colorTiles[winningColorIndex].isCorrect = true;
  return colorTiles;
};

export const colorPickerStore = create<ColorPickerStore>((set, get) => ({
  colorTiles: getNewColorTiles(6),
  isNewGame: true,
  isGameOver: false,
  gameLevel: 6,
  averageScore: 0,
  guessCount: 0,
  gamesPlayed: 0,
  startNewGame: () => {
    set((state) => ({
      colorTiles: getNewColorTiles(state.gameLevel),
      isNewGame: false,
      isGameOver: false,
      isEasyMode: state.gameLevel,
      guessCount: 0,
      gamesPlayed: state.gamesPlayed + 1,
    }));
  },
  checkColor: (squareNumber: number) => {
    set((state) => {
      const newColorTiles = [...state.colorTiles];
      newColorTiles[squareNumber].isClicked = true;
      const isCorrect = newColorTiles[squareNumber].isCorrect;
      const guessCount = state.guessCount + 1;
      const gamesPlayed = isCorrect ? state.gamesPlayed + 1 : state.gamesPlayed;
      const averageScore = isCorrect
        ? (guessCount + state.averageScore * (gamesPlayed - 1)) / gamesPlayed
        : state.averageScore;

      return {
        colorTiles: newColorTiles,
        isGameOver: isCorrect,
        gameLevel: state.gameLevel,
        guessCount: state.guessCount + 1,
        gamesPlayed: state.gamesPlayed,
        averageScore: averageScore,
      };
    });
  },

  winningColor: () => {
    const winner = get().colorTiles.find((tile) => tile.isCorrect);
    // change color to just display the numbers with spaces between
    const colorDisplay =
      winner?.color.replace("rgb(", "").replace(")", "").split(",").join(" ") ||
      "error";
    return colorDisplay;
  },
  setGameLevel: (gameLevel: number) => {
    set((state) => ({
      gameLevel: gameLevel,
      colorTiles: getNewColorTiles(gameLevel),
      isNewGame: true,
      isGameOver: false,
      guessCount: 0,
      gamesPlayed: state.gamesPlayed,
      averageScore: state.averageScore,
    }));
  },
}));
