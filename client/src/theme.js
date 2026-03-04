import { createTheme } from '@mui/material/styles';

// Color palette extracted from the QUALITTEST logo
const colors = {
  // Primary colors from logo
  navyBlue: '#1a3a52',      // Dark navy blue (main dark color)
  cyan: '#00a8cc',          // Bright cyan/turquoise
  lightCyan: '#5dc1d8',     // Light cyan accent
  green: '#6ba946',         // Fresh green from test tubes
  lightGreen: '#9bcc5f',    // Light green accent
  grayBlue: '#a8c5d1',      // Light gray-blue background

  // Additional colors for UI
  white: '#ffffff',
  lightGray: '#f5f5f5',
  mediumGray: '#e0e0e0',
  darkGray: '#757575',
  error: '#d32f2f',
  warning: '#ed6c02',
  success: '#2e7d32',
};

const theme = createTheme({
  palette: {
    primary: {
      main: colors.navyBlue,
      light: colors.lightCyan,
      dark: '#0d1f2d',
      contrastText: colors.white,
    },
    secondary: {
      main: colors.cyan,
      light: colors.lightCyan,
      dark: '#007d96',
      contrastText: colors.white,
    },
    success: {
      main: colors.green,
      light: colors.lightGreen,
      dark: '#4d7d33',
    },
    background: {
      default: colors.lightGray,
      paper: colors.white,
    },
    text: {
      primary: colors.navyBlue,
      secondary: colors.darkGray,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: colors.navyBlue,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      color: colors.navyBlue,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500,
      color: colors.navyBlue,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: colors.navyBlue,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          borderRadius: 8,
          padding: '8px 24px',
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          borderRadius: 12,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: colors.cyan,
            },
          },
        },
      },
    },
  },
});

export default theme;
export { colors };
