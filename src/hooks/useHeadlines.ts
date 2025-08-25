import { useState, useEffect, useCallback } from 'react';
import apiService from '../api/apiService';
import { useSelection } from '../contexts/SelectionContext.tsx';
import { useFeedContext } from '../contexts/FeedContext.tsx';
import type { ApiArticle } from '../api/types';
import { useSettings } from '../contexts/SettingsContext.tsx';

export const useHeadlines = () => {
  const { incrementUnreadCount, decrementUnreadCount, incrementStarredCount, decrementStarredCount, refetchCounters, incrementPublishedCount, decrementPublishedCount } = useFeedContext();
  const { selection } = useSelection();
  const { isApiReady } = useSettings();
  const [headlines, setHeadlines] = useState<ApiArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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
      incrementStarredCount();
    } else {
      decrementStarredCount();
    }

    try {
      await apiService.markArticleAsStarred(articleId, starred);
    } catch (e) {
      console.error(`Failed to mark article ${articleId} as starred.`, e);
      setHeadlineStarredStatus(articleId, !starred);
       if (starred) {
        decrementStarredCount();
      } else {
        incrementStarredCount();
      }
    }
  }, [setHeadlineStarredStatus, incrementStarredCount, decrementStarredCount]);

  const markArticleAsPublished = useCallback(async (articleId: number, published: boolean) => {
    setHeadlinePublishedStatus(articleId, published);
    if (published) {
      incrementPublishedCount();
    } else {
      decrementPublishedCount();
    }

    try {
      await apiService.markArticleAsPublished(articleId, published);
    } catch (e) {
      console.error(`Failed to mark article ${articleId} as published.`, e);
      // Revert on error
      setHeadlinePublishedStatus(articleId, !published);
      if (published) {
        decrementPublishedCount();
      } else {
        incrementPublishedCount();
      }
    }
  }, [setHeadlinePublishedStatus, incrementPublishedCount, decrementPublishedCount]);

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

  useEffect(() => {
    const fetchHeadlines = async () => {
      if (!selection || !isApiReady) {
        setHeadlines([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const fetchedHeadlines = await apiService.getHeadlines(
          selection.id,
          selection.isCategory
        );
        setHeadlines(fetchedHeadlines);
      } catch (e) {
        setError('Failed to fetch headlines.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeadlines();
  }, [selection, isApiReady]);

  return { headlines, isLoading, error, markArticleAsRead, markFeedAsRead, markArticleAsStarred, fetchArticleContent, markArticleAsPublished, setHeadlineUnreadStatus };
};
