/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./client/src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        pc: {
          white: "var(--pc-white)",
          tan: "var(--pc-tan)",
          olive: "var(--pc-olive)",
          navy: "var(--pc-navy)",
          bg: "var(--pc-bg)",
          "bg-alt": "var(--pc-bg-alt)",
          text: "var(--pc-text)",
          "text-light": "var(--pc-text-light)",
        },
      },
      borderRadius: {
        pc: "var(--pc-radius)",
        "pc-lg": "var(--pc-radius-lg)",
      },
      boxShadow: {
        pc: "var(--pc-shadow)",
        "pc-lg": "var(--pc-shadow-lg)",
      },
      transitionTimingFunction: {
        pc: "var(--pc-transition)",
        "pc-slow": "var(--pc-transition-slow)",
      },
    },
  },
  plugins: [],
};

export default config;

