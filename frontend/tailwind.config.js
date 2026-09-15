/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pitch: {
          emerald: "#0b4f6c", // Primary Brand Color (#0b4f6c)
          darkEmerald: "#07384d", // Darker shade for hover state
          lime: "#84cc16", // Electric Lime (#84cc16) - Highlight Accent
          navy: "#0f172a", // Dark Slate Background
          slate: "#1e293b",
          lightBg: "#f8fafc",
          accentAmber: "#f59e0b",
          accentRed: "#ef4444",
        }
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
