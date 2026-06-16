/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <-- Agar code src folder mein hai, toh yeh line must hai
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}