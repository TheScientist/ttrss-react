import { createContext, useState, useContext, type ReactNode, useEffect } from 'react';
import type { Settings } from '../types/settings';
import { getSettings, saveSettings } from '../store/settings';

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

  return (
    <SettingsContext.Provider value={{ settings, setSettings: handleSetSettings, isInitialized }}>
      {children}
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
