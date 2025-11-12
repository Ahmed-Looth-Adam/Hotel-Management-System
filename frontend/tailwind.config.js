/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // Important: Use class-based strategy to avoid conflicts with MUI
  important: '#root',

  theme: {
    extend: {
      // Extend MUI breakpoints to match (optional)
      screens: {
        'xs': '0px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },

      // Match MUI theme colors (optional - for consistency)
      colors: {
        primary: {
          main: '#1e3a5f',
          light: '#3d5a7e',
          dark: '#152840',
        },
        secondary: {
          main: '#d4af37',
          light: '#e0c05f',
          dark: '#b8941f',
        },
      },
    },
  },

  // Disable Tailwind's preflight to avoid conflicts with MUI's CssBaseline
  corePlugins: {
    preflight: false,
  },

  plugins: [],
}