import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import apiService from '../api/apiService';
import { useSettings } from './SettingsContext';

interface ApiContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  apiService: typeof apiService;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export const ApiProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useSettings();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const login = async () => {
      if (settings) {
        setIsLoading(true);
        setError(null);
        try {
          const success = await apiService.login(settings);
          setIsLoggedIn(success);
          if (!success) {
            setError('Login failed. Please check your credentials in the settings.');
          }
        } catch (e) {
          setError('An error occurred during login.');
          setIsLoggedIn(false);
        }
        setIsLoading(false);
      }
    };

    if (settings) {
      login();
    } else {
      setIsLoading(false);
    }
  }, [settings]);

  return (
    <ApiContext.Provider value={{ isLoggedIn, isLoading, error, apiService }}>
      {children}
    </ApiContext.Provider>
  );
};

export const useApi = (): ApiContextType => {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};
