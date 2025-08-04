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

ReactDOM.createRoot(document.getElementById('root')!).render(
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
