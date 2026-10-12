/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Same dark palette as mobile — students see the same UI everywhere
        bg: {
          primary: "#0A1628",
          secondary: "#0F1F3A",
          tertiary: "#1A2E4A",
          border: "#1E3A5F",
        },
        brand: {
          primary: "#2E86C1",
          secondary: "#3498DB",
          accent: "#F39C12",
          success: "#2ECC71",
          danger: "#E74C3C",
          warning: "#F1C40F",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#B0C4DE",
          muted: "#6B7F99",
        },
      },
    },
  },
  plugins: [],
};