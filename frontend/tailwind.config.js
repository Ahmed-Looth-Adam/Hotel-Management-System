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

      // Match MUI theme colors
      colors: {
        primary: {
          main: '#00A699',
          light: '#33b8ae',
          dark: '#00746b',
        },
        secondary: {
          main: '#FF5A5F',
          light: '#ff7b7f',
          dark: '#b33f42',
        },
        background: {
          default: '#f7f7f7',
          paper: '#ffffff',
        },
        text: {
          primary: '#222222',
          secondary: '#717171',
        }
      },
    },
  },

  // Disable Tailwind's preflight to avoid conflicts with MUI's CssBaseline
  corePlugins: {
    preflight: false,
  },

  plugins: [],
}