import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // We kept the legacy names to prevent breaking class references, 
        // but updated the hex values for the new premium aesthetic.
        discordDark: "#262626",      // Neutral dark gray (borders)
        discordDarker: "#0a0a0a",    // Very dark gray (panels/surfaces)
        discordDarkest: "#000000",   // Pure OLED black (app background)
        discordLight: "#f8f9fa",     // Premium off-white
        discordPrimary: "#0ea5e9",   // Vibrant Sky Blue (Accent)
        
        // Legacy gradients (can be used for special badges)
        instaGradientStart: "#fbd38d",
        instaGradientMid1: "#f6ad55",
        instaGradientMid2: "#f56565",
        instaGradientEnd: "#ed64a6",
        instaGradientBlue: "#9f7aea",
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 15px rgba(14, 165, 233, 0.4)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)'],
        mono: ['var(--font-geist-mono)'],
      }
    },
  },
  plugins: [],
};
export default config;
