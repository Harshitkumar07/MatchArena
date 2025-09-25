/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "../src/**/*.{js,jsx,ts,tsx}",
    "../public/index.html"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        cricket: {
          light: '#86efac',
          DEFAULT: '#22c55e',
          dark: '#16a34a'
        },
        football: {
          light: '#93c5fd',
          DEFAULT: '#3b82f6',
          dark: '#2563eb'
        },
        kabaddi: {
          light: '#fdba74',
          DEFAULT: '#fb923c',
          dark: '#ea580c'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        shimmer: {
          '100%': {
            transform: 'translateX(100%)',
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
