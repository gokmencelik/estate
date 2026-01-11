import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dynamic theme color (supports opacity): set `--primary` as "R G B" (space-separated).
        primary: "rgb(var(--primary) / <alpha-value>)"
      }
    }
  },
  plugins: []
} satisfies Config;

