import { createTheme, ThemeOptions } from '@mui/material/styles';

const baseTheme: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.5rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem',
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 6,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
};

export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'light',
    primary: {
      main: '#006BB4',
      light: '#4A90C2',
      dark: '#004A7C',
    },
    secondary: {
      main: '#7B68EE',
      light: '#9B8AEE',
      dark: '#5B48CC',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#343741',
      secondary: '#69707D',
    },
    divider: '#D3DAE6',
  },
});

export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#4A90C2',
      light: '#6BA3D0',
      dark: '#2E5F8A',
    },
    secondary: {
      main: '#9B8AEE',
      light: '#B5A7F1',
      dark: '#7B68EE',
    },
    background: {
      default: '#1D1E24',
      paper: '#25262E',
    },
    text: {
      primary: '#DDD',
      secondary: '#98A2B3',
    },
    divider: '#343741',
  },
});
