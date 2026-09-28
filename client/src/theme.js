import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0B1F5C', // Navy
      light: '#1E56C8', // Royal Blue
    },
    secondary: {
      main: '#6B2FBF', // Violet
    },
    success: {
      main: '#2E9E5B', // Emerald
    },
    warning: {
      main: '#F59E0B', // Saffron
    },
    background: {
      default: '#F6F8FC', // Off-white
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Inter", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600 },
    h4: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600 },
    h5: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600 },
    h6: { fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 24px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
          borderRadius: 12,
        },
      },
    },
  },
});

export default theme;
