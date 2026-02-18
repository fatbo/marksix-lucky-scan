import { createTheme } from '@mui/material/styles';

export const getTheme = (darkMode: boolean) =>
  createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#003366' },
      secondary: { main: '#FFD700' },
      success: { main: '#4CAF50' },
      error: { main: '#F44336' },
      ...(darkMode
        ? { background: { default: '#121212', paper: '#1e1e1e' } }
        : { background: { default: '#f5f5f5', paper: '#ffffff' } }),
    },
    typography: {
      fontFamily: '"Roboto", "Noto Sans TC", sans-serif',
    },
    shape: { borderRadius: 12 },
  });
