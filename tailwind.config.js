/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // Isso diz ao Tailwind para escanear seus arquivos Vue, JS, TS, etc.
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}