import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  IconButton,
  Container,
  useMediaQuery,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  DarkMode,
  LightMode,
  Language as LanguageIcon,
  Home,
  History,
  Info,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store';

const tabPaths = ['/', '/history', '/about'];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useAppStore();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);

  const currentTab = tabPaths.indexOf(location.pathname);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    navigate(tabPaths[newValue]);
  };

  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
    setLangAnchor(null);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" sx={{ bgcolor: 'primary.main' }}>
        <Toolbar>
          <Typography
            variant="h6"
            sx={{ flexGrow: 1, fontWeight: 'bold', color: 'secondary.main' }}
          >
            🎰 {t('appName')}
          </Typography>
          <IconButton
            color="inherit"
            onClick={(e) => setLangAnchor(e.currentTarget)}
            aria-label={t('common.language')}
          >
            <LanguageIcon />
          </IconButton>
          <Menu
            anchorEl={langAnchor}
            open={Boolean(langAnchor)}
            onClose={() => setLangAnchor(null)}
          >
            <MenuItem onClick={() => handleLangChange('en')}>English</MenuItem>
            <MenuItem onClick={() => handleLangChange('zh')}>繁體中文</MenuItem>
          </Menu>
          <IconButton
            color="inherit"
            onClick={toggleDarkMode}
            aria-label={t('common.darkMode')}
          >
            {darkMode ? <LightMode /> : <DarkMode />}
          </IconButton>
        </Toolbar>
        <Tabs
          value={currentTab === -1 ? 0 : currentTab}
          onChange={handleTabChange}
          variant={isMobile ? 'fullWidth' : 'standard'}
          textColor="inherit"
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: 'secondary.main' },
            bgcolor: 'rgba(0,0,0,0.1)',
          }}
        >
          <Tab icon={isMobile ? <Home /> : undefined} label={t('tabs.home')} aria-label={t('tabs.home')} />
          <Tab icon={isMobile ? <History /> : undefined} label={t('tabs.history')} aria-label={t('tabs.history')} />
          <Tab icon={isMobile ? <Info /> : undefined} label={t('tabs.about')} aria-label={t('tabs.about')} />
        </Tabs>
      </AppBar>
      <Container maxWidth="md" sx={{ flex: 1, py: 3 }}>
        {children}
      </Container>
    </Box>
  );
}
