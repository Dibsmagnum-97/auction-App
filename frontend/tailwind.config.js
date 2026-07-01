/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // <--- MAKE SURE THIS LINE IS HERE
  theme: {
    extend: {},
  },
  plugins: [],
}