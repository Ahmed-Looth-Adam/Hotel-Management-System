/**
 * Material-UI v7 Theme Configuration for Hotel Management System
 *
 * Design Philosophy:
 * - "Modern Luxury" / "Minimalist Premium"
 * - Monochrome Palette: Black (`#222222`), White (`#ffffff`), Greys (`#717171`)
 * - No heavy accent colors. The content (images) should provide the color.
 * - Flat design, subtle borders instead of shadows.
 * - Maximize whitespace.
 *
 * Edited By:
 * -> Ismail Wasiu Abdul Samad, UWE ID: 24050765
 */

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',

    primary: {
      main: '#000000',      // Pure Black for primary actions/text
      light: '#333333',
      dark: '#000000',
      contrastText: '#ffffff',
    },

    secondary: {
      main: '#717171',      // Dark Gray for secondary actions
      light: '#999999',
      dark: '#484848',
      contrastText: '#ffffff',
    },

    background: {
      default: '#ffffff',   // Pure white background
      paper: '#ffffff',     // Pure white cards
    },

    text: {
      primary: '#222222',   // Soft black for text
      secondary: '#717171', // Airbnb gray
      disabled: '#dddddd',
    },

    divider: '#dddddd',     // Very light gray

    action: {
      hover: 'rgba(0, 0, 0, 0.04)',
    }
  },

  typography: {
    fontFamily: [
      'Circular',
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Roboto',
      'sans-serif',
    ].join(','),

    h1: { fontSize: '2rem', fontWeight: 800, color: '#222222' },
    h2: { fontSize: '1.75rem', fontWeight: 700, color: '#222222' },
    h3: { fontSize: '1.5rem', fontWeight: 600, color: '#222222' },
    h4: { fontSize: '1.25rem', fontWeight: 600, color: '#222222' },
    subtitle1: { fontSize: '1rem', fontWeight: 500, color: '#222222' },
    body1: { fontSize: '1rem', lineHeight: 1.5, color: '#222222' },
    button: { fontWeight: 600, textTransform: 'none', fontSize: '1rem' },
  },

  spacing: 8,

  shape: {
    borderRadius: 8, // Standard refined radius
  },

  shadows: Array(25).fill('none'), // COMPLETELY FLAT DESIGN (No elevation shadows)

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '12px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
            backgroundColor: '#f7f7f7', // Subtle gray hover
          },
        },
        containedPrimary: {
          backgroundColor: '#000000',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#333333',
          },
        },
        outlinedPrimary: {
          borderColor: '#222222',
          color: '#222222',
          '&:hover': {
            backgroundColor: '#f7f7f7',
            borderColor: '#000000',
          },
        }
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: 'none', // Removed border for cleaner look
          borderRadius: 12,
          backgroundColor: 'transparent', // Transparent by default
        },
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#222222',
          boxShadow: 'none',
          borderBottom: 'none', // Clean header
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 32, // Pill shape
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: '1px',
            borderColor: '#000000',
          }
        }
      }
    }
  },
});

export default theme;
