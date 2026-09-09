/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        helix: {
          DEFAULT: '#6D28D9',
          light: '#8B5CF6',
          dark: '#4C1D95',
        },
      },
    },
  },
  plugins: [],
}
