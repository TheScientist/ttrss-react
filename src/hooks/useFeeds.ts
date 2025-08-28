import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../contexts/ApiContext.tsx';
import type { ApiCategory, ApiFeed, ApiCounterItem } from '../api/types.ts';
import {
  SPECIAL_CATEGORY_ID,
  SPECIAL_FEED_ARCHIVED,
  SPECIAL_FEED_STARRED,
  SPECIAL_FEED_PUBLISHED,
  SPECIAL_FEED_UNREAD,
  SPECIAL_FEED_ALL,
  SPECIAL_FEED_RECENTLY_READ,
} from '../constants/specialFeeds';

export interface TreeCategory extends ApiCategory {
  feeds: ApiFeed[];
}

export const useFeeds = () => {
  const { isLoggedIn, apiService } = useApi();
  const [treeData, setTreeData] = useState<TreeCategory[]>([]);

  // Generic helper to adjust a special feed counter by delta (+1/-1/any)
  const adjustSpecialCounter = useCallback((specialFeedId: number, delta: number) => {
    setTreeData(currentTreeData => {
      const newTreeData: TreeCategory[] = JSON.parse(JSON.stringify(currentTreeData));
      const specialCategory = newTreeData.find((c: TreeCategory) => c.id === SPECIAL_CATEGORY_ID);
      if (specialCategory) {
        const specialFeed = specialCategory.feeds.find((f: ApiFeed) => f.id === specialFeedId);
        if (specialFeed) {
          const next = (specialFeed.unread ?? 0) + delta;
          specialFeed.unread = Math.max(0, next);
        }
      }
      return newTreeData;
    });
  }, [setTreeData]);

  const decrementUnreadCount = useCallback((feedId: number, newCount?: number) => {
    setTreeData(currentTreeData => {
        const newTreeData = JSON.parse(JSON.stringify(currentTreeData));
        let unreadDiff = 0;

        // Find the feed and update its unread count
        for (const category of newTreeData) {
            const feed = category.feeds.find((f: ApiFeed) => f.id === feedId);
            if (feed && feed.unread > 0) {
                const oldUnread = feed.unread;
                feed.unread = typeof newCount === 'number' ? newCount : feed.unread - 1;
                unreadDiff = oldUnread - feed.unread;
                break; // Feed found, exit loop
            }
        }

        // If a feed was updated, also update the global "Unread Articles" counter within the same state update
        if (unreadDiff > 0 && feedId !== SPECIAL_FEED_UNREAD) {
          const specialCategory = newTreeData.find((c: TreeCategory) => c.id === SPECIAL_CATEGORY_ID);
          if (specialCategory) {
            const unreadSpecial = specialCategory.feeds.find((f: ApiFeed) => f.id === SPECIAL_FEED_UNREAD);
            if (unreadSpecial) {
              unreadSpecial.unread = Math.max(0, (unreadSpecial.unread ?? 0) - unreadDiff);
            }
          }
        }
        
        return newTreeData;
    });
  }, [setTreeData, adjustSpecialCounter]);
  const incrementUnreadCount = useCallback((feedId: number) => {
    setTreeData(currentTreeData => {
      const newTreeData: TreeCategory[] = JSON.parse(JSON.stringify(currentTreeData));
      let feedFound = false;
      for (const category of newTreeData) {
        const feed = category.feeds.find((f: ApiFeed) => f.id === feedId);
        if (feed) {
          feed.unread += 1;
          feedFound = true;
          break;
        }
      }

      if (feedFound) {
        // increment global unread unless we are already updating the special Unread feed itself
        if (feedId !== SPECIAL_FEED_UNREAD) {
          const specialCategory = newTreeData.find((c: TreeCategory) => c.id === SPECIAL_CATEGORY_ID);
          if (specialCategory) {
            const unreadSpecial = specialCategory.feeds.find((f: ApiFeed) => f.id === SPECIAL_FEED_UNREAD);
            if (unreadSpecial) {
              unreadSpecial.unread = Math.max(0, (unreadSpecial.unread ?? 0) + 1);
            }
          }
        }
        return newTreeData;
      }

      return newTreeData;
    });
  }, [setTreeData, adjustSpecialCounter]);

  // Starred/Published helpers have been removed in favor of calling adjustSpecialCounter directly

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeeds = useCallback(async () => {
    if (!isLoggedIn) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const categories = await apiService.getCategories();
      const feedPromises = categories.map(async (category: ApiCategory) => {
        const feeds = await apiService.getFeeds(category.id);
        const feedsWithIcons = feeds.map((feed: ApiFeed) => ({
          ...feed,
          iconUrl: (feed.has_icon ? apiService.getFeedIconUrl(feed.id) : undefined) ?? undefined,
        }));
        return { ...category, feeds: feedsWithIcons };
      });

      let populatedTree = await Promise.all(feedPromises);

      // Sort "Special" category to the top
      const specialCategoryIndex = populatedTree.findIndex((c: TreeCategory) => c.id === SPECIAL_CATEGORY_ID);
      if (specialCategoryIndex > -1) {
        const specialCategory = populatedTree.splice(specialCategoryIndex, 1)[0];

        const specialFeedIcons: { [key: number]: string } = {
          [SPECIAL_FEED_ARCHIVED]: 'archive_outlined',
          [SPECIAL_FEED_STARRED]: 'star_border',
          [SPECIAL_FEED_PUBLISHED]: 'public',
          [SPECIAL_FEED_UNREAD]: 'weekend_outlined',
          [SPECIAL_FEED_ALL]: 'folder_open',
          [SPECIAL_FEED_RECENTLY_READ]: 'history',
        };

        specialCategory.feeds = specialCategory.feeds.map((feed: ApiFeed) => {
          return {
            ...feed,
            iconUrl: feed.iconUrl,
            muiIcon: specialFeedIcons[feed.id],
          };
        });

        populatedTree.unshift(specialCategory);
      }

      setTreeData(populatedTree);
      await refetchCounters();
    } catch (e) {
      setError('Failed to fetch feeds and categories.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchFeeds();
  }, [fetchFeeds]);

  const refetchCounters = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const counters = await apiService.getCounters();
      const counterMap = new Map<string, Pick<ApiCounterItem, 'counter' | 'auxcounter'>>();
      counters.forEach((c: ApiCounterItem) => {
        const key = c.kind === 'cat' ? `cat_${c.id}` : `feed_${c.id}`;
        counterMap.set(key, { counter: c.counter, auxcounter: c.auxcounter });
      });

      setTreeData(currentTreeData => {
        const newTreeData = JSON.parse(JSON.stringify(currentTreeData));

        newTreeData.forEach((cat: TreeCategory) => {
          // Update feed counters within the category
          cat.feeds.forEach((feed: ApiFeed) => {
            const feedKey = `feed_${feed.id}`;
            if (counterMap.has(feedKey)) {
              const counterData = counterMap.get(feedKey)!;
              if ((feed.id === SPECIAL_FEED_STARRED || feed.id === SPECIAL_FEED_PUBLISHED || feed.id === SPECIAL_FEED_ARCHIVED) && counterData.auxcounter !== undefined) {
                feed.unread = counterData.auxcounter;
              } else {
                feed.unread = counterData.counter;
              }
            }
          });
        });

        return newTreeData;
      });
    } catch (error) {
      console.error('Failed to refetch counters:', error);
    }
  }, [isLoggedIn, apiService, setTreeData]);

  return { treeData, isLoading, error, fetchFeeds, refetchCounters, incrementUnreadCount, decrementUnreadCount, adjustSpecialCounter };
};
