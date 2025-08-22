import { describe, it, expect } from 'vitest';
import { findFeedInfoInTree } from './feedUtils';
import type { TreeCategory } from '../hooks/useFeeds';

const mockTreeData: TreeCategory[] = [
  {
    id: 1,
    title: 'Category 1',
    unread: 5,
    labels: [],
    note: null,
    icon: '',
    cat_id: 1,
    feeds: [
      { id: 101, title: 'Feed 1.1', unread: 2, iconUrl: 'icon1.png', muiIcon: null, cat_id: 1, has_icon: false },
      { id: 102, title: 'Feed 1.2', unread: 3, iconUrl: 'icon2.png', muiIcon: null, cat_id: 1, has_icon: false },
    ],
  },
  {
    id: 2,
    title: 'Category 2',
    unread: 0,
    labels: [],
    note: null,
    icon: '',
    cat_id: 2,
    feeds: [
      { id: 201, title: 'Feed 2.1', unread: 0, iconUrl: 'icon3.png', muiIcon: null, cat_id: 2, has_icon: false },
    ],
  },
];

describe('findFeedInfoInTree', () => {
  it('should find a feed if it exists', () => {
    const feed = findFeedInfoInTree(102, mockTreeData);
    expect(feed).not.toBeNull();
    expect(feed?.id).toBe(102);
    expect(feed?.title).toBe('Feed 1.2');
  });

  it('should return null if the feed does not exist', () => {
    const feed = findFeedInfoInTree(999, mockTreeData);
    expect(feed).toBeNull();
  });

  it('should return null if treeData is null', () => {
    const feed = findFeedInfoInTree(101, null);
    expect(feed).toBeNull();
  });
});
