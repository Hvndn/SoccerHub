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
        // Be Vietnam Pro — hỗ trợ đầy đủ dấu tiếng Việt, đủ dải weight (100→900)
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      fontSize: {
        // Thang chữ mobile-first, tăng nhẹ để dễ đọc trên điện thoại
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
    },
  },
  plugins: [],
};
