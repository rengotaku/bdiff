/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
        },
        secondary: {
          DEFAULT: '#64748b',
          hover: '#475569',
        },
        diff: {
          added: '#d4f4dd',
          'added-dark': '#16a34a',
          removed: '#fdd4d4',
          'removed-dark': '#dc2626',
          modified: '#fef3c7',
          'modified-dark': '#ca8a04',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      }
    },
  },
  plugins: [],
}