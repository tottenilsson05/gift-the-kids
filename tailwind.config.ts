import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        neon: "#14F5A8", // sampled from the gift ribbon — used sparingly
        mint: "#A8F5D4",
        muted: "#8A928F",
        line: "rgba(255,255,255,0.09)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      keyframes: {
        // 1. Gift fades in and settles upward into place
        "logo-in": {
          from: { opacity: "0", transform: "translateY(16px) scale(0.985)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // 2. Slow, gentle float (5px), no rotation
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-5px)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        // "backwards" (not "both") so hover transforms work once the entrance ends
        "logo-in": "logo-in 1.2s cubic-bezier(0.22,1,0.36,1) backwards",
        float: "float 6s ease-in-out 1.3s infinite",
        "fade-up": "fade-up 0.85s cubic-bezier(0.22,1,0.36,1) backwards",
        "fade-in": "fade-in 1.6s ease-out backwards",
      },
    },
  },
  plugins: [],
};

export default config;
