import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import i18n from '../i18n';
import type { Settings } from '../types/settings';
import { getSettings, saveSettings } from '../store/settings';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { GlobalStyles, CssBaseline } from '@mui/material';
import apiService from '../api/apiService';

interface SettingsContextType {
  settings: Settings | null;
  setSettings: (settings: Settings) => void;
  isInitialized: boolean;
  isApiReady: boolean;
  login: (settings: Settings) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);

  const login = useCallback(async (loginSettings: Settings): Promise<boolean> => {
    const success = await apiService.login(loginSettings);
    if (success) {
      setIsApiReady(true);
      saveSettings(loginSettings); // Save settings on successful login
      setSettingsState(loginSettings);
    } else {
      setIsApiReady(false);
    }
    return success;
  }, []);

  useEffect(() => {
    const storedSettings = getSettings();
    if (storedSettings) {
      setSettingsState(storedSettings);
      login(storedSettings); // Attempt to log in with stored settings
    }
    setIsInitialized(true);
  }, [login]);

  useEffect(() => {
    if (settings?.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings?.language]);

  const handleSetSettings = (newSettings: Settings) => {
    setSettingsState(newSettings);
    saveSettings(newSettings);
  };

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          // Use MUI default primary. Move brand orange to secondary.
          secondary: {
            main: '#FF9800',
          },
          mode: settings?.darkMode ? 'dark' : 'light',
        },
      }),
    [settings?.darkMode]
  );

  // Keep Android status bar color (theme-color) in sync with theme
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    if (!meta || !manifestLink) return;
    const lightColor = '#ffffff';
    const darkColor = '#121212'; // MUI dark background
    const current = theme.palette.mode === 'dark' ? darkColor : lightColor;
    meta.setAttribute('content', current);
    manifestLink.setAttribute('href', theme.palette.mode === 'dark' ? '/manifest-dark.json' : '/manifest.json');
  }, [theme]);

  const value = { settings, setSettings: handleSetSettings, isInitialized, isApiReady, login };

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
