import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SettingsProvider } from './contexts/SettingsContext';
import { ApiProvider } from './contexts/ApiContext';
import { SelectionProvider } from './contexts/SelectionContext';
import { FeedProvider } from './contexts/FeedContext';
import { HeadlinesProvider } from './contexts/HeadlinesContext';
import App from './App';
import './index.css';
import './i18n'; // Initialize i18next
import { i18nReady } from './i18n';

const root = ReactDOM.createRoot(document.getElementById('root')!);

// Load runtime config for basename
const loadBasePath = async (): Promise<string> => {
  try {
    const response = await fetch('./config.json');
    if (!response.ok) throw new Error('Failed to load config');
    const config = await response.json();
    return config.basePath || '/';
  } catch (error) {
    console.warn('Could not load config.json, using default basePath "/"');
    return '/';
  }
};

// Optionally render a minimal placeholder while i18n loads
root.render(<div style={{ display: 'none' }} />);

(async () => {
  const basename = await loadBasePath();
  
  i18nReady.finally(() => {
    root.render(
      <React.StrictMode>
        <BrowserRouter basename={basename}>
          <SettingsProvider>
            <ApiProvider>
              <FeedProvider>
                <SelectionProvider>
                  <HeadlinesProvider>
                    <App />
                  </HeadlinesProvider>
                </SelectionProvider>
              </FeedProvider>
            </ApiProvider>
          </SettingsProvider>
        </BrowserRouter>
      </React.StrictMode>
    );
  });
})();
