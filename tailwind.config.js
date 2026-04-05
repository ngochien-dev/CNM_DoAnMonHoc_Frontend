/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        discord: {
          dark: '#313338',
          darker: '#2b2d31',
          darkest: '#1e1f22',
          blurple: '#5865f2',
          gray: '#b5bac1',
          link: '#00a8fc',
        }
      }
    }
  },
  plugins: [],
}