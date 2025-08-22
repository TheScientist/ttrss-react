import { useState, useEffect, useCallback } from 'react';
import apiService from '../api/apiService.ts';
import { useApi } from '../contexts/ApiContext.tsx';
import type { ApiCategory, ApiFeed } from '../api/types.ts';

export interface TreeCategory extends ApiCategory {
  feeds: ApiFeed[];
}

export const useFeeds = () => {
  const { isLoggedIn } = useApi();
  const [treeData, setTreeData] = useState<TreeCategory[]>([]);

  const decrementUnreadCount = useCallback((feedId: number) => {
    setTreeData(currentTreeData => {
      const newTreeData = JSON.parse(JSON.stringify(currentTreeData));

      let feedFound = false;
      for (const category of newTreeData) {
        const feed = category.feeds.find((f: ApiFeed) => f.id === feedId);
        if (feed && feed.unread > 0) {
          feed.unread -= 1;
          feedFound = true;
          if (category.id !== -1) {
            category.unread = Math.max(0, category.unread - 1);
          }
          break; 
        }
      }

      if (feedFound) {
          const specialCategory = newTreeData.find((c: TreeCategory) => c.id === -1);
          if (specialCategory) {
            const unreadFeed = specialCategory.feeds.find((f: ApiFeed) => f.id === -3); // -3 is Unread Articles
            if (unreadFeed && unreadFeed.unread > 0) {
              unreadFeed.unread -= 1;
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

  return { treeData, isLoading, error, fetchFeeds, incrementUnreadCount, decrementUnreadCount, incrementStarredCount, decrementStarredCount };
};
