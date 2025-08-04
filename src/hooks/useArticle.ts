import { useState, useEffect } from 'react';
import apiService from '../api/apiService';


import type { ApiArticle } from '../api/types';

import { useFeedContext } from '../contexts/FeedContext';
import { useHeadlinesContext } from '../contexts/HeadlinesContext.tsx';

export const useArticle = (articleId: number | null) => {
  const { decrementUnreadCount } = useFeedContext();
  const { setHeadlineUnreadStatus } = useHeadlinesContext();
  const [article, setArticle] = useState<ApiArticle | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchArticle = async () => {
      if (!articleId) {
        setArticle(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
                const fetchedArticle = await apiService.getArticle(articleId);
        setArticle(fetchedArticle);

                if (fetchedArticle.unread) {
                    await apiService.markArticleAsRead(articleId);
          setArticle({ ...fetchedArticle, unread: false });
                    setHeadlineUnreadStatus(articleId, false);
          decrementUnreadCount(fetchedArticle.feed_id);
        }
      } catch (e) {
        setError('Failed to fetch article.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
      }, [articleId, setHeadlineUnreadStatus, decrementUnreadCount]);

  return { article, isLoading, error };
};
