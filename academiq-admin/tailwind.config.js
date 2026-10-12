/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Admin light-mode palette
        bg: {
          primary: "#F4F6F8",
          secondary: "#FFFFFF",
          tertiary: "#EAF0F6",
          border: "#D8E0E8",
        },
        brand: {
          primary: "#1A5276",
          secondary: "#2E86C1",
          accent: "#F39C12",
          success: "#1E8449",
          danger: "#C0392B",
        },
        text: {
          primary: "#2C3E50",
          secondary: "#5D6D7E",
          muted: "#95A5A6",
        },
      },
    },
  },
  plugins: [],
};