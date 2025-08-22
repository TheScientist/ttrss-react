import { createContext, useState, useContext, type ReactNode, useEffect, useMemo } from 'react';
import type { Settings } from '../types/settings';
import { getSettings, saveSettings } from '../store/settings';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { GlobalStyles, CssBaseline } from '@mui/material';

interface SettingsContextType {
  settings: Settings | null;
  setSettings: (settings: Settings) => void;
  isInitialized: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedSettings = getSettings();
    if (storedSettings) {
      setSettingsState(storedSettings);
    }
    setIsInitialized(true);
  }, []);

  const handleSetSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: settings?.darkMode ? 'dark' : 'light',
        },
      }),
    [settings?.darkMode]
  );

  const value = { settings, setSettings: handleSetSettings, isInitialized };

  return (
    <SettingsContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{ body: { margin: 0 } }} />
        {children}
      </ThemeProvider>
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
