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

// Optionally render a minimal placeholder while i18n loads
root.render(<div style={{ display: 'none' }} />);

i18nReady.finally(() => {
  root.render(
    <React.StrictMode>
      <BrowserRouter>
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
