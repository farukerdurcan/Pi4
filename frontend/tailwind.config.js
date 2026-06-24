/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        tatko: {
          DEFAULT: "#132D50",
          koyu: "#0C1F38",
          acik: "#1A3D6E",
        }
      }
    },
  },
  plugins: [],
}
