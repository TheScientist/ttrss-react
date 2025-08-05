import { useState, useEffect, useCallback } from 'react';
import apiService from '../api/apiService';
import { useSelection } from '../contexts/SelectionContext.tsx';
import type { ApiArticle } from '../api/types';

export const useHeadlines = () => {
  const { selection } = useSelection();
  const [headlines, setHeadlines] = useState<ApiArticle[]>([]);
  const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

  const setHeadlineUnreadStatus = useCallback((articleId: number, unread: boolean) => {
    setHeadlines(currentHeadlines =>
      currentHeadlines.map(headline =>
        headline.id === articleId ? { ...headline, unread } : headline
      )
    );
  }, []);

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

    return { headlines, isLoading, error, setHeadlineUnreadStatus };
};
