import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { useSettings } from '../contexts/SettingsContext';
import { TextField, Button, Switch, FormControlLabel, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const getInitialLanguage = () => {
  const browserLang = navigator.language.split('-')[0];
  const { supportedLngs } = i18n.options;
  if (supportedLngs && supportedLngs.includes(browserLang)) {
    return browserLang;
  }
  return 'en';
};

const SettingsPage: React.FC = () => {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();
  const [apiUrl, setApiUrl] = useState('/api/');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [counterUpdateInterval, setCounterUpdateInterval] = useState(30);
  const [language, setLanguage] = useState(getInitialLanguage);
  const [markOnScroll, setMarkOnScroll] = useState(true);

  useEffect(() => {
    if (settings) {
      setApiUrl(settings.apiUrl);
      setUsername(settings.username);
      setPassword(settings.password);
      setDarkMode(settings.darkMode || false);
      setCounterUpdateInterval(settings.counterUpdateInterval ?? 30);
      if (settings.language) {
        setLanguage(settings.language);
      }
      setMarkOnScroll(settings.markOnScroll ?? true);
    }
  }, [settings]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSettings({ apiUrl, username, password, darkMode, counterUpdateInterval, language, markOnScroll });
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        label={t('api_url_label')}
        type='url'
        variant="outlined"
        fullWidth
        margin="normal"
        value={apiUrl}
        onChange={(e) => setApiUrl(e.target.value)}
        required
      />
      <TextField
        label={t('username_label')}
        type='text'
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
      <FormControlLabel
        control={<Switch checked={markOnScroll} onChange={(e) => setMarkOnScroll(e.target.checked)} />}
        label={t('mark_on_scroll_label', { defaultValue: 'Mark on scroll' })}
      />
      <FormControl fullWidth margin="normal">
        <InputLabel id="language-select-label">{t('language_label')}</InputLabel>
        <Select
          labelId="language-select-label"
          value={language}
          label={t('language_label')}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <MenuItem value="en">English</MenuItem>
          <MenuItem value="de">Deutsch</MenuItem>
        </Select>
      </FormControl>
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
  );
};

export default SettingsPage;
