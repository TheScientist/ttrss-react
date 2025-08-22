import { useState, useEffect, useCallback } from 'react';
import apiService from '../api/apiService';
import { useSelection } from '../contexts/SelectionContext.tsx';
import { useFeedContext } from '../contexts/FeedContext.tsx';
import type { ApiArticle } from '../api/types';

export const useHeadlines = () => {
  const { incrementUnreadCount, decrementUnreadCount, incrementStarredCount, decrementStarredCount } = useFeedContext();
  const { selection } = useSelection();
  const [headlines, setHeadlines] = useState<ApiArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);



  const setHeadlineStarredStatus = useCallback((articleId: number, starred: boolean) => {
    setHeadlines(currentHeadlines =>
      currentHeadlines.map(headline =>
        headline.id === articleId ? { ...headline, marked: starred } : headline
      )
    );
  }, []);

  const markArticleAsRead = useCallback(async (articleId: number, feedId: number, isCurrentlyUnread: boolean) => {
    // The action is to toggle the current state. The API's `read` param aligns with `isCurrentlyUnread`.
    const apiAction = isCurrentlyUnread;

    // Optimistically update the UI
    setHeadlines(currentHeadlines =>
      currentHeadlines.map(headline =>
        headline.id === articleId ? { ...headline, unread: !isCurrentlyUnread } : headline
      )
    );

    // Adjust counters based on the action
    if (apiAction) { // We are marking it as READ
      decrementUnreadCount(feedId);
    } else { // We are marking it as UNREAD
      incrementUnreadCount(feedId);
    }

    try {
      // Make the API call
      await apiService.markArticleAsRead(articleId, apiAction);
    } catch (e) {
      console.error(`Failed to mark article ${articleId} as read.`, e);
      // Revert the UI changes on error
      setHeadlines(currentHeadlines =>
        currentHeadlines.map(headline =>
          headline.id === articleId ? { ...headline, unread: isCurrentlyUnread } : headline
        )
      );
      // Revert the counter changes
      if (apiAction) {
        incrementUnreadCount(feedId);
      } else {
        decrementUnreadCount(feedId);
      }
    }
  }, [decrementUnreadCount, incrementUnreadCount]);

  const markArticleAsStarred = useCallback(async (articleId: number, starred: boolean) => {
    try {
      await apiService.markArticleAsStarred(articleId, starred);
      setHeadlineStarredStatus(articleId, starred);
      if (starred) {
        incrementStarredCount();
      } else {
        decrementStarredCount();
      }
    } catch (e) {
      console.error(`Failed to mark article ${articleId} as starred.`, e);
      // Optionally, revert the UI change here or show an error
    }
  }, [setHeadlineStarredStatus, incrementStarredCount, decrementStarredCount]);

  const fetchArticleContent = useCallback(async (articleId: number) => {
    // Avoid refetching if content seems complete
    const existingArticle = headlines.find(h => h.id === articleId);
    if (existingArticle?.content && existingArticle.content.length > 200) { // Heuristic check
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
      if (!selection) {
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
  }, [selection]);

  return { headlines, isLoading, error, markArticleAsRead, markArticleAsStarred, fetchArticleContent };
};
