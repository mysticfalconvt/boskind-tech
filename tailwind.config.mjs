import daisyui from "daisyui";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        default: ["var(--font-FiraCode)"],
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["winter", "dark"],
  },
};
