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
          50: '#f0f7ff',
          100: '#e0effe',
          500: '#0284c7',
          600: '#0265d2',
          700: '#034aa6',
          900: '#0c2340',
        },
        risk: {
          low: '#10b981',
          medium: '#eab308',
          high: '#f97316',
          critical: '#ef4444',
        }
      }
    },
  },
  plugins: [],
}
