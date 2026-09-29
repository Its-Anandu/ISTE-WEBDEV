import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FFFFFF",
        foreground: "#000000",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
        anton: ["var(--font-anton)", "sans-serif"],
        jakarta: ["var(--font-jakarta)", "sans-serif"],
      },
      animation: {
        "fade-rise": "fadeRise 0.8s ease-out forwards",
        "fade-rise-delay": "fadeRise 0.8s ease-out 0.2s forwards",
        "fade-rise-delay-2": "fadeRise 0.8s ease-out 0.4s forwards",
      },
      keyframes: {
        fadeRise: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
