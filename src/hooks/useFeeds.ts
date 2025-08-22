import { useState, useEffect, useCallback } from 'react';
import { useApi } from '../contexts/ApiContext.tsx';
import type { ApiCategory, ApiFeed, ApiCounterItem } from '../api/types.ts';

export interface TreeCategory extends ApiCategory {
  feeds: ApiFeed[];
}

export const useFeeds = () => {
  const { isLoggedIn, apiService } = useApi();
  const [treeData, setTreeData] = useState<TreeCategory[]>([]);

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

                // Update the category count (if it's not a special category)
                if (category.id !== -1) {
                    category.unread = Math.max(0, category.unread - unreadDiff);
                }
                break; // Feed found, exit loop
            }
        }

        // If a feed was updated, also update the global "Unread Articles" counter
        if (unreadDiff > 0) {
            const specialCategory = newTreeData.find((c: TreeCategory) => c.id === -1);
            if (specialCategory) {
                const unreadFeed = specialCategory.feeds.find((f: ApiFeed) => f.id === -6); // -6 is Unread Articles
                if (unreadFeed) {
                    unreadFeed.unread = Math.max(0, unreadFeed.unread - unreadDiff);
                }
            }
        }
        
        return newTreeData;
    });
  }, [setTreeData]);
  const incrementUnreadCount = useCallback((feedId: number) => {
    setTreeData(currentTreeData => {
      const newTreeData: TreeCategory[] = JSON.parse(JSON.stringify(currentTreeData));
      let feedFound = false;
      for (const category of newTreeData) {
        const feed = category.feeds.find((f: ApiFeed) => f.id === feedId);
        if (feed) {
          feed.unread += 1;
          feedFound = true;
          if (category.id !== -1) {
            category.unread += 1;
          }
          break;
        }
      }

      if (feedFound) {
        const specialCategory = newTreeData.find((c: TreeCategory) => c.id === -1);
        if (specialCategory) {
          const unreadFeed = specialCategory.feeds.find((f: ApiFeed) => f.id === -3); // -3 is Unread Articles
          if (unreadFeed) {
            unreadFeed.unread += 1;
          }
        }
      }

      return newTreeData;
    });
  }, [setTreeData]);

  const incrementStarredCount = useCallback(() => {
    setTreeData(currentTreeData => {
      const newTreeData: TreeCategory[] = JSON.parse(JSON.stringify(currentTreeData));
      const specialCategory = newTreeData.find((c: TreeCategory) => c.id === -1);
      if (specialCategory) {
        const starredFeed = specialCategory.feeds.find((f: ApiFeed) => f.id === -1);
        if (starredFeed) {
          starredFeed.unread += 1;
        }
      }
      return newTreeData;
    });
  }, [setTreeData]);

  const decrementStarredCount = useCallback(() => {
    setTreeData(currentTreeData => {
      const newTreeData: TreeCategory[] = JSON.parse(JSON.stringify(currentTreeData));
      const specialCategory = newTreeData.find((c: TreeCategory) => c.id === -1);
      if (specialCategory) {
        const starredFeed = specialCategory.feeds.find((f: ApiFeed) => f.id === -1);
        if (starredFeed && starredFeed.unread > 0) {
          starredFeed.unread -= 1;
        }
      }
      return newTreeData;
    });
  }, [setTreeData]);

  const incrementPublishedCount = useCallback(() => {
    setTreeData(currentTreeData => {
      const newTreeData: TreeCategory[] = JSON.parse(JSON.stringify(currentTreeData));
      const specialCategory = newTreeData.find((c: TreeCategory) => c.id === -1);
      if (specialCategory) {
        const publishedFeed = specialCategory.feeds.find((f: ApiFeed) => f.id === -2);
        if (publishedFeed) {
          publishedFeed.unread += 1;
        }
      }
      return newTreeData;
    });
  }, [setTreeData]);

  const decrementPublishedCount = useCallback(() => {
    setTreeData(currentTreeData => {
      const newTreeData: TreeCategory[] = JSON.parse(JSON.stringify(currentTreeData));
      const specialCategory = newTreeData.find((c: TreeCategory) => c.id === -1);
      if (specialCategory) {
        const publishedFeed = specialCategory.feeds.find((f: ApiFeed) => f.id === -2);
        if (publishedFeed && publishedFeed.unread > 0) {
          publishedFeed.unread -= 1;
        }
      }
      return newTreeData;
    });
  }, [setTreeData]);

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
      const feedPromises = categories.map(async (category) => {
        const feeds = await apiService.getFeeds(category.id);
        const feedsWithIcons = feeds.map((feed) => ({
          ...feed,
          iconUrl: (feed.has_icon ? apiService.getFeedIconUrl(feed.id) : undefined) ?? undefined,
        }));
        return { ...category, feeds: feedsWithIcons };
      });

      let populatedTree = await Promise.all(feedPromises);

      // Sort "Special" category to the top and adjust its counter
      const specialCategoryIndex = populatedTree.findIndex(c => c.id === -1);
      if (specialCategoryIndex > -1) {
        const specialCategory = populatedTree.splice(specialCategoryIndex, 1)[0];

        const recentlyReadFeed = specialCategory.feeds.find(f => f.id === -3);
        if (recentlyReadFeed) {
          specialCategory.unread = recentlyReadFeed.unread;
        }

        const specialFeedIcons: { [key: number]: string } = {
          0: 'archive_outlined',    // Archived Articles
          [-1]: 'star_border',          // Starred Articles
          [-2]: 'public',             // Published Articles
          [-3]: 'weekend_outlined',            // Recently Read Articles (using History icon instead of WeekendOutlined)
          [-4]: 'folder_open',         // All Articles
          [-6]: 'history',            // Unread Articles
        };

        specialCategory.feeds = specialCategory.feeds.map(feed => ({
          ...feed,
          muiIcon: specialFeedIcons[feed.id],
        }));

        populatedTree.unshift(specialCategory);
      }

      setTreeData(populatedTree);
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
      const counterMap = new Map<string, number>();
      counters.forEach((c: ApiCounterItem) => counterMap.set(String(c.id), c.counter));

      setTreeData(currentTreeData => {
        const newTreeData = JSON.parse(JSON.stringify(currentTreeData));

        // Update category counters
        newTreeData.forEach((cat: TreeCategory) => {
          const catKey = String(cat.id);
          if (counterMap.has(catKey)) {
            cat.unread = counterMap.get(catKey)!;
          }

          // Update feed counters within the category
          cat.feeds.forEach((feed: ApiFeed) => {
            const feedKey = String(feed.id);
            if (counterMap.has(feedKey)) {
              feed.unread = counterMap.get(feedKey)!;
            }
          });
        });

        return newTreeData;
      });
    } catch (error) {
      console.error('Failed to refetch counters:', error);
    }
  }, [isLoggedIn, apiService, setTreeData]);

  return { treeData, isLoading, error, fetchFeeds, refetchCounters, incrementUnreadCount, decrementUnreadCount, incrementStarredCount, decrementStarredCount, incrementPublishedCount, decrementPublishedCount };
};
