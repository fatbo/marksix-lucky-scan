import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  Paper,
} from '@mui/material';
import { CheckCircle } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function AboutPage() {
  const { t } = useTranslation();
  const featureList = t('about.featureList', { returnObjects: true }) as string[];

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        {t('about.title')}
      </Typography>
      <Paper sx={{ p: 3, mb: 2 }}>
        <Typography paragraph>{t('about.description')}</Typography>
        <Typography variant="h6" gutterBottom>
          {t('about.features')}
        </Typography>
        <List>
          {Array.isArray(featureList) &&
            featureList.map((feature, i) => (
              <ListItem key={i} disableGutters>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircle color="success" />
                </ListItemIcon>
                <ListItemText primary={feature} />
              </ListItem>
            ))}
        </List>
      </Paper>
      <Alert severity="warning">{t('about.disclaimer')}</Alert>
    </Box>
  );
}
