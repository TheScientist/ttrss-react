import React, { createContext, useContext, type ReactNode } from 'react';
import { useHeadlines } from '../hooks/useHeadlines.ts';
import type { ApiArticle } from '../api/types.ts';

interface HeadlinesContextType {
  markArticleAsRead: (articleId: number, feedId: number, isCurrentlyUnread: boolean) => Promise<void>;
  headlines: ApiArticle[];
  isLoading: boolean;
  error: string | null;

  markArticleAsStarred: (articleId: number, starred: boolean) => Promise<void>;
  markArticleAsPublished: (articleId: number, published: boolean) => Promise<void>;
  markFeedAsRead: (feedId: number, isCategory: boolean) => Promise<void>;
  fetchArticleContent: (articleId: number) => Promise<void>;
  setHeadlineUnreadStatus: (articleId: number, unread: boolean) => void;
}

const HeadlinesContext = createContext<HeadlinesContextType | undefined>(
  undefined
);

export const HeadlinesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { headlines, isLoading, error, markArticleAsRead, markFeedAsRead, markArticleAsStarred, fetchArticleContent, markArticleAsPublished, setHeadlineUnreadStatus } = useHeadlines();

  const value = { headlines, isLoading, error, markArticleAsRead, markFeedAsRead, markArticleAsStarred, fetchArticleContent, markArticleAsPublished, setHeadlineUnreadStatus };

  return (
    <HeadlinesContext.Provider value={value}>
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
