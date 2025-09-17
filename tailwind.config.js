/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // New Color Palette
        primary: {
          DEFAULT: '#3182CE',  // Main blue
          hover: '#2C5282',    // Darker blue
          dark: '#2A4365',     // Darkest blue
        },
        gray: {
          light: '#4A5568',    // Light gray for text
          DEFAULT: '#2D3748',  // Main gray
          dark: '#1A202C',     // Dark gray
        },
        danger: {
          DEFAULT: '#E53E3E',  // Warning red
          dark: '#C53030',     // Darker red
        },
        // Keep diff colors for file comparison
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