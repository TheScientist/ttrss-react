import React, { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Container, TextField, Button, Typography, Box } from '@mui/material';

const SettingsPage: React.FC = () => {
  const { settings, setSettings } = useSettings();
        const [apiUrl, setApiUrl] = useState('/api');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (settings) {
      setApiUrl(settings.apiUrl);
      setUsername(settings.username);
      setPassword(settings.password);
    }
  }, [settings]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSettings({ apiUrl, username, password });
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="API URL"
            variant="outlined"
            fullWidth
            margin="normal"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            required
          />
          <TextField
            label="Username"
            variant="outlined"
            fullWidth
            margin="normal"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
            Save Settings
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default SettingsPage;
