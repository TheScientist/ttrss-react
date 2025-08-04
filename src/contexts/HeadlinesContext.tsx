import React, { createContext, useContext, type ReactNode } from 'react';
import { useHeadlines } from '../hooks/useHeadlines.ts';
import type { ApiArticle } from '../api/types.ts';

interface HeadlinesContextType {
  headlines: ApiArticle[];
  isLoading: boolean;
  error: string | null;
  setHeadlineUnreadStatus: (articleId: number, unread: boolean) => void;
}

const HeadlinesContext = createContext<HeadlinesContextType | undefined>(
  undefined
);

export const HeadlinesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const headlinesData = useHeadlines();

  return (
    <HeadlinesContext.Provider value={headlinesData}>
      {children}
    </HeadlinesContext.Provider>
  );
};

export const useHeadlinesContext = () => {
  const context = useContext(HeadlinesContext);
  if (context === undefined) {
    throw new Error('useHeadlinesContext must be used within a HeadlinesProvider');
  }
  return context;
};
