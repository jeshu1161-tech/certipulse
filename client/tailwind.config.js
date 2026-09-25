/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        cyber: {
          neon: '#06b6d4',
          accent: '#10b981',
          dark: '#0f172a',
          card: '#1e293b'
        }
      }
    },
  },
  plugins: [],
}
