import { useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Snackbar, Alert } from '@mui/material';
import { getTheme } from './theme';
import { useAppStore } from './store';
import Layout from './components/Layout';
import TicketUpload from './components/TicketUpload';
import HistoryPage from './components/HistoryPage';
import AboutPage from './components/AboutPage';

export default function App() {
  const { darkMode, snackbar, hideSnackbar } = useAppStore();
  const theme = useMemo(() => getTheme(darkMode), [darkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Layout>
        <Routes>
          <Route path="/" element={<TicketUpload />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Layout>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={hideSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={hideSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
