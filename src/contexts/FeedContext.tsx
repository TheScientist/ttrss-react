import React, { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useFeeds, type TreeCategory } from '../hooks/useFeeds.ts';

interface FeedContextType {
  treeData: TreeCategory[];
  isLoading: boolean;
  error: string | null;
  refetchFeeds: () => void;
  incrementUnreadCount: (feedId: number) => void;
  decrementUnreadCount: (feedId: number) => void;
  incrementStarredCount: () => void;
  decrementStarredCount: () => void;
}

const FeedContext = createContext<FeedContextType | undefined>(undefined);

export const FeedProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { treeData, isLoading, error, fetchFeeds, incrementUnreadCount, decrementUnreadCount, incrementStarredCount, decrementStarredCount } = useFeeds();

  const refetchFeeds = useCallback(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  return (
    <FeedContext.Provider value={{ treeData, isLoading, error, refetchFeeds, incrementUnreadCount, decrementUnreadCount, incrementStarredCount, decrementStarredCount }}>
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
