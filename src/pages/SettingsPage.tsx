import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../contexts/SettingsContext';
import { Container, TextField, Button, Typography, Box, Switch, FormControlLabel } from '@mui/material';

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();
        const [apiUrl, setApiUrl] = useState('/api');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [counterUpdateInterval, setCounterUpdateInterval] = useState(300);

  useEffect(() => {
    if (settings) {
      setApiUrl(settings.apiUrl);
      setUsername(settings.username);
      setPassword(settings.password);
      setDarkMode(settings.darkMode || false);
      setCounterUpdateInterval(settings.counterUpdateInterval ?? 300);
    }
  }, [settings]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSettings({ apiUrl, username, password, darkMode, counterUpdateInterval });
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('settings_title')}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label={t('api_url_label')}
            variant="outlined"
            fullWidth
            margin="normal"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            required
          />
          <TextField
            label={t('username_label')}
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            label={t('password_label')}
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <FormControlLabel
            control={<Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />}
            label={t('dark_mode_label')}
          />
          <TextField
            label={t('counter_interval_label')}
            type="number"
            variant="outlined"
            fullWidth
            margin="normal"
            value={counterUpdateInterval}
            onChange={(e) => setCounterUpdateInterval(Number(e.target.value))}
            InputProps={{ inputProps: { min: 0 } }}
            helperText={t('counter_interval_helper')}
          />
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
            {t('login_button')}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default SettingsPage;
