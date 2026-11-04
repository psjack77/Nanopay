/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        ink: { 950: '#070d1a', 900: '#0a1222', 800: '#0f1b33', 700: '#16264a' },
        arc: { 300: '#acc6e9', 400: '#8fb2df', 500: '#6e97cf' },
      },
    },
  },
  plugins: [],
}

