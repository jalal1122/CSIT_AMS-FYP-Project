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
          DEFAULT: '#4F46E5', // Indigo 600
          dark: '#3730A3', // Indigo 800
        },
        secondary: '#10B981', // Emerald 500
        accent: '#F59E0B', // Amber 500
        danger: '#EF4444', // Red 500
        surface: {
          DEFAULT: '#1E1B4B', // Deep Indigo
          light: '#2D2A6E',
        }
      }
    },
  },
  plugins: [],
}
