import React, { createContext, useContext, useCallback, type ReactNode, useEffect } from 'react';
import { useSettings } from './SettingsContext';
import { useFeeds, type TreeCategory } from '../hooks/useFeeds.ts';

interface FeedContextType {
  treeData: TreeCategory[];
  isLoading: boolean;
  error: string | null;
  refetchFeeds: () => void;
  incrementUnreadCount: (feedId: number) => void;
  decrementUnreadCount: (feedId: number, newCount?: number) => void;
  refetchCounters: () => Promise<void>;
  incrementStarredCount: () => void;
  decrementStarredCount: () => void;
  incrementPublishedCount: () => void;
  decrementPublishedCount: () => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings } = useSettings();
  const { treeData, isLoading, error, fetchFeeds, refetchCounters, incrementUnreadCount, decrementUnreadCount, incrementStarredCount, decrementStarredCount, incrementPublishedCount, decrementPublishedCount } = useFeeds();

  useEffect(() => {
    const intervalSeconds = settings?.counterUpdateInterval ?? 300;
    if (intervalSeconds > 0) {
      const intervalId = setInterval(() => {
        refetchCounters();
      }, intervalSeconds * 1000);

      return () => clearInterval(intervalId);
    }
  }, [settings?.counterUpdateInterval, refetchCounters]);

  const refetchFeeds = useCallback(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  return (
    <FeedContext.Provider value={{ treeData, isLoading, error, refetchFeeds, refetchCounters, incrementUnreadCount, decrementUnreadCount, incrementStarredCount, decrementStarredCount, incrementPublishedCount, decrementPublishedCount }}>
      {children}
    </FeedContext.Provider>
  );
};

export const useFeedContext = () => {
  const context = useContext(FeedContext);
  if (context === undefined) {
    throw new Error('useFeedContext must be used within a FeedProvider');
  }
  return context;
};
