import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SettingsProvider, useSettings } from './SettingsContext';

// Mocks
vi.mock('../store/settings', () => ({
  getSettings: vi.fn(),
  saveSettings: vi.fn(),
}));
vi.mock('../api/apiService', () => ({
  default: { login: vi.fn() },
}));
vi.mock('../i18n', () => ({
  default: { changeLanguage: vi.fn() },
}));

import { getSettings, saveSettings } from '../store/settings';
import apiService from '../api/apiService';
import i18n from '../i18n';

const TestConsumer = () => {
  const { settings, setSettings, isInitialized, isApiReady } = useSettings();
  return (
    <div>
      <div>initialized:{String(isInitialized)}</div>
      <div>apiReady:{String(isApiReady)}</div>
      <div>lang:{settings?.language ?? ''}</div>
      <button onClick={() => setSettings({ apiUrl: 'https://h/api/', username: 'u', password: 'p', language: 'de', darkMode: true })}>
        set
      </button>
    </div>
  );
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
);

describe('SettingsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes from stored settings and logs in', async () => {
    (getSettings as any).mockReturnValue({ apiUrl: 'https://s/api/', username: 'u', password: 'p', language: 'en', darkMode: false });
    (apiService.login as any).mockResolvedValue(true);

    render(<TestConsumer />, { wrapper });

    // initialized should become true
    await screen.findByText('initialized:true');
    // login success should mark apiReady true
    await screen.findByText('apiReady:true');

    expect(apiService.login).toHaveBeenCalledWith({ apiUrl: 'https://s/api/', username: 'u', password: 'p', language: 'en', darkMode: false });
    expect(i18n.changeLanguage).toHaveBeenCalledWith('en');
  });

  it('setSettings saves and updates language', async () => {
    (getSettings as any).mockReturnValue(null);
    (apiService.login as any).mockResolvedValue(false);

    render(<TestConsumer />, { wrapper });

    // click to set settings
    await act(async () => {
      screen.getByText('set').click();
    });

    expect(saveSettings).toHaveBeenCalled();
    expect(i18n.changeLanguage).toHaveBeenCalledWith('de');
    // language reflected in consumer
    await screen.findByText('lang:de');
  });
});
