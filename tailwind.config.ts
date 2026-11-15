import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: { radar: { bg: "#000", grid: "#0a2a1a", safe: "#39ff14", danger: "#ff1744", sun: "#ffd600", earth: "#00b0ff" } },
      fontFamily: { mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"] },
      keyframes: { lethal: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.25" } } },
      animation: { lethal: "lethal 0.6s steps(2, jump-none) infinite" },
    },
  },
  plugins: [],
};
export default config;
