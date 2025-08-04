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
      let categoryToUpdate = null;

      for (const category of newTreeData) {
        const feedToUpdate = category.feeds.find((f: ApiFeed) => f.id === feedId);
        if (feedToUpdate && feedToUpdate.unread > 0) {
          feedToUpdate.unread -= 1;
          categoryToUpdate = category;
          break;
        }
      }

      if (categoryToUpdate && categoryToUpdate.unread > 0) {
        categoryToUpdate.unread -= 1;
      }

      return newTreeData;
    });
  }, []);
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

  return { treeData, isLoading, error, fetchFeeds, decrementUnreadCount };
};
