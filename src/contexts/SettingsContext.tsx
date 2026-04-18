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
      await saveSettings(loginSettings);
      setSettingsState(loginSettings);
    } else {
      setIsApiReady(false);
    }
    return success;
  }, []);

  useEffect(() => {
    const initSettings = async () => {
      const storedSettings = await getSettings();
      if (storedSettings) {
        setSettingsState(storedSettings);
        await login(storedSettings);
      }
      setIsInitialized(true);
    };
    initSettings();
  }, [login]);

  useEffect(() => {
    if (settings?.language) {
      i18n.changeLanguage(settings.language);
    }
  }, [settings?.language]);

  const handleSetSettings = async (newSettings: Settings) => {
    setSettingsState(newSettings);
    await saveSettings(newSettings);
  };

  const theme = useMemo(() => {
    // Detect theme from document's color-scheme
    // This matches what's baked into the HTML at build time
    const isDark = document.documentElement.style.colorScheme === 'dark' ||
                   getComputedStyle(document.documentElement).colorScheme === 'dark';
    
    return createTheme({
      palette: {
        secondary: {
          main: '#FF9800',
        },
        mode: isDark ? 'dark' : 'light',
      },
    });
  }, []);

  const value = { settings, setSettings: handleSetSettings, isInitialized, isApiReady, login };

  return (
    <SettingsContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles
          styles={{
            body: {
              margin: 0,
              backgroundColor: theme.palette.mode === 'dark' ? '#121212' : '#ffffff',
              colorScheme: theme.palette.mode,
            },
          }}
        />
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
