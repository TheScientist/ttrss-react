/// <reference types="@testing-library/jest-dom" />

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import * as SettingsContext from '../contexts/SettingsContext';
import SettingsPage from './SettingsPage';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Mock the t function to return the key
  }),
  initReactI18next: {
    type: '3rdParty',
    init: vi.fn(),
  },
}));

describe('SettingsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the settings form', () => {
    // Spy on useSettings and provide a mock implementation
    vi.spyOn(SettingsContext, 'useSettings').mockReturnValue({
      settings: {
        apiUrl: 'https://example.com/api',
        username: 'testuser',
        password: 'password',
        darkMode: false,
        counterUpdateInterval: 300,
        language: 'en',
      },
      setSettings: vi.fn(),
      isInitialized: true,
      isApiReady: true,
      login: vi.fn().mockResolvedValue(true),
    });

    const theme = createTheme();

    render(
      <ThemeProvider theme={theme}>
        <SettingsPage />
      </ThemeProvider>
    );

    // Check if the API URL field is rendered with the correct value
    const apiUrlInput = screen.getByLabelText(/api_url_label/i) as HTMLInputElement;
    expect(apiUrlInput).toBeInTheDocument();
    expect(apiUrlInput.value).toBe('https://example.com/api');

    // Check for another field to ensure the form is rendered
    const usernameInput = screen.getByLabelText(/username_label/i) as HTMLInputElement;
    expect(usernameInput).toBeInTheDocument();
    expect(usernameInput.value).toBe('testuser');
  });
});
