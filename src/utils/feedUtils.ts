import type { TreeCategory } from '../hooks/useFeeds';
import type { ApiFeed } from '../api/types';

/**
 * Finds a feed's information within the nested category tree data.
 * @param feedId The ID of the feed to find.
 * @param treeData The array of categories.
 * @returns The feed object if found, otherwise null.
 */
export const findFeedInfoInTree = (feedId: number, treeData: TreeCategory[] | null): ApiFeed | null => {
  if (!treeData) return null;

  for (const category of treeData) {
    const feed = category.feeds.find((f: ApiFeed) => f.id === feedId);
    if (feed) {
      return feed;
    }
  }

  return null;
};
