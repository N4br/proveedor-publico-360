import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        lexum: {
          navy: "#0b1f3a",
          ink: "#132238",
          gold: "#d7b56d",
          mist: "#eef3f7",
          line: "#d9e1ea",
          teal: "#0f766e",
          wine: "#8a1538"
        }
      },
      boxShadow: {
        panel: "0 18px 50px rgba(11,31,58,0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
