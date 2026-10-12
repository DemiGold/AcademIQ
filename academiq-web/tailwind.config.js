/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
          border: "var(--bg-border)",
        },
        brand: {
          primary: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          accent: "var(--brand-accent)",
          success: "var(--brand-success)",
          danger: "var(--brand-danger)",
          warning: "var(--brand-warning)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
      },
    },
  },
  plugins: [],
};