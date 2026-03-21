import { useState, useEffect, useCallback } from 'react';
import apiService from '../api/apiService';
import { useSelection } from '../contexts/SelectionContext.tsx';
import { useFeedContext } from '../contexts/FeedContext.tsx';
import { SPECIAL_FEED_PUBLISHED, SPECIAL_FEED_STARRED, SPECIAL_FEED_UNREAD } from '../constants/specialFeeds';
import type { ApiArticle } from '../api/types';
import { useSettings } from '../contexts/SettingsContext.tsx';

export const useHeadlines = () => {
  const { incrementUnreadCount, decrementUnreadCount, refetchCounters, adjustSpecialCounter } = useFeedContext();
  const { selection } = useSelection();
  const { isApiReady } = useSettings();
  const [headlines, setHeadlines] = useState<ApiArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 20;
  const [error, setError] = useState<string | null>(null);

  const setHeadlinePublishedStatus = useCallback((articleId: number, published: boolean) => {
    setHeadlines(currentHeadlines =>
      currentHeadlines.map(headline =>
        headline.id === articleId ? { ...headline, published } : headline
      )
    );
  }, []);

  const setHeadlineStarredStatus = useCallback((articleId: number, starred: boolean) => {
    setHeadlines(currentHeadlines =>
      currentHeadlines.map(headline =>
        headline.id === articleId ? { ...headline, marked: starred } : headline
      )
    );
  }, []);

  const setHeadlineUnreadStatus = useCallback((articleId: number, unread: boolean) => {
    setHeadlines(currentHeadlines =>
      currentHeadlines.map(headline =>
        headline.id === articleId ? { ...headline, unread } : headline
      )
    );
  }, []);

  const markArticleAsRead = useCallback(async (articleId: number, feedId: number, isCurrentlyUnread: boolean) => {
    const apiAction = isCurrentlyUnread;

    setHeadlines(currentHeadlines =>
      currentHeadlines.map(headline =>
        headline.id === articleId ? { ...headline, unread: !isCurrentlyUnread } : headline
      )
    );

    if (apiAction) {
      decrementUnreadCount(feedId);
    } else {
      incrementUnreadCount(feedId);
    }

    try {
      await apiService.markArticleAsRead(articleId, apiAction);
    } catch (e) {
      console.error(`Failed to mark article ${articleId} as read.`, e);
      setHeadlines(currentHeadlines =>
        currentHeadlines.map(headline =>
          headline.id === articleId ? { ...headline, unread: isCurrentlyUnread } : headline
        )
      );
      if (apiAction) {
        incrementUnreadCount(feedId);
      } else {
        decrementUnreadCount(feedId);
      }
    }
  }, [incrementUnreadCount, decrementUnreadCount]);

  const markFeedAsRead = useCallback(async (feedId: number, isCategory: boolean) => {
    try {
      await apiService.catchupFeed(feedId, isCategory);
      setHeadlines(currentHeadlines => 
        currentHeadlines.map(h => ({ ...h, unread: false }))
      );
      await refetchCounters();
    } catch (e) {
      console.error(`Failed to catchup feed ${feedId}`, e);
    }
  }, [refetchCounters]);

  const markArticleAsStarred = useCallback(async (articleId: number, starred: boolean) => {
    setHeadlineStarredStatus(articleId, starred);
    if (starred) {
      adjustSpecialCounter(SPECIAL_FEED_STARRED, +1);
    } else {
      adjustSpecialCounter(SPECIAL_FEED_STARRED, -1);
    }

    try {
      await apiService.markArticleAsStarred(articleId, starred);
    } catch (e) {
      console.error(`Failed to mark article ${articleId} as starred.`, e);
      setHeadlineStarredStatus(articleId, !starred);
      if (starred) {
        adjustSpecialCounter(SPECIAL_FEED_STARRED, -1);
      } else {
        adjustSpecialCounter(SPECIAL_FEED_STARRED, +1);
      }
    }
  }, [setHeadlineStarredStatus, adjustSpecialCounter]);

  const markArticleAsPublished = useCallback(async (articleId: number, published: boolean) => {
    setHeadlinePublishedStatus(articleId, published);
    if (published) {
      adjustSpecialCounter(SPECIAL_FEED_PUBLISHED, +1);
    } else {
      adjustSpecialCounter(SPECIAL_FEED_PUBLISHED, -1);
    }

    try {
      await apiService.markArticleAsPublished(articleId, published);
    } catch (e) {
      console.error(`Failed to mark article ${articleId} as published.`, e);
      // Revert on error
      setHeadlinePublishedStatus(articleId, !published);
      if (published) {
        adjustSpecialCounter(SPECIAL_FEED_PUBLISHED, -1);
      } else {
        adjustSpecialCounter(SPECIAL_FEED_PUBLISHED, +1);
      }
    }
  }, [setHeadlinePublishedStatus, adjustSpecialCounter]);

  const fetchArticleContent = useCallback(async (articleId: number) => {
    const existingArticle = headlines.find(h => h.id === articleId);
    if (existingArticle?.content && existingArticle.content.length > 200) {
      return;
    }

    try {
      const fullArticle = await apiService.getArticle(articleId);
      setHeadlines(currentHeadlines =>
        currentHeadlines.map(h =>
          h.id === articleId ? { ...h, content: fullArticle.content } : h
        )
      );
    } catch (e) {
      console.error(`Failed to fetch content for article ${articleId}`, e);
    }
  }, [headlines]);

  // Calculate the correct offset based on selected feed and current headlines
  const calculateOffset = useCallback((headlines: ApiArticle[], selection: any): number => {
    if (!selection) return 0;
    
    if (selection.id === SPECIAL_FEED_UNREAD) {
      // For Unread feed, offset = count of unread items
      return headlines.filter(h => h.unread).length;
    } else if (selection.id === SPECIAL_FEED_STARRED) {
      // For Starred feed, offset = count of marked items
      return headlines.filter(h => h.marked).length;
    } else if (selection.id === SPECIAL_FEED_PUBLISHED) {
      // For Published feed, offset = count of published items
      return headlines.filter(h => h.published).length;
    }
    
    // For normal feeds, offset = total headlines count
    return headlines.length;
  }, []);

  const fetchInitial = useCallback(async () => {
    if (!selection || !isApiReady) {
      setHeadlines([]);
      setHasMore(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasMore(true);

    try {
      const fetchedHeadlines = await apiService.getHeadlines(
        selection.id,
        selection.isCategory,
        { limit: pageSize, skip: 0 }
      );
      setHeadlines(fetchedHeadlines);
      setHasMore(fetchedHeadlines.length === pageSize);
    } catch (e) {
      setError('Failed to fetch headlines.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [selection, isApiReady, calculateOffset]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const loadMore = useCallback(async () => {
    if (!selection || !isApiReady || isLoading || isLoadingMore || !hasMore) return;
    
    // Calculate current offset based on headlines matching the current filter
    const currentOffset = calculateOffset(headlines, selection);
    
    setIsLoadingMore(true);
    try {
      const more = await apiService.getHeadlines(
        selection.id,
        selection.isCategory,
        { limit: pageSize, skip: currentOffset }
      );
      setHeadlines(curr => {
        const updated = [...curr, ...more];
        return updated;
      });
      setHasMore(more.length === pageSize);
    } catch (e) {
      console.error('Failed to load more headlines', e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [selection, isApiReady, isLoading, isLoadingMore, hasMore, headlines, calculateOffset]);

  return { headlines, isLoading, isLoadingMore, hasMore, error, loadMore, markArticleAsRead, markFeedAsRead, markArticleAsStarred, fetchArticleContent, markArticleAsPublished, setHeadlineUnreadStatus };
};
