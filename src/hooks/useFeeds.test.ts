import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Mock ApiContext.useApi used inside the hook
vi.mock('../contexts/ApiContext.tsx', () => {
  return {
    useApi: () => ({
      isLoggedIn: true,
      apiService: {
        getCategories: vi.fn(async () => ([
          { id: -1, title: 'Special', unread: 0 },
          { id: 10, title: 'News', unread: 5 },
        ])),
        getFeeds: vi.fn(async (catId: number) => (catId === -1
          ? [
              { id: -1, title: 'Starred', unread: 1 },
              { id: -2, title: 'Published', unread: 2 },
              { id: -3, title: 'Recently Read', unread: 7 },
              { id: -4, title: 'All Articles', unread: 0 },
              { id: -6, title: 'Unread', unread: 9 },
            ]
          : [
              { id: 100, title: 'Tech', unread: 3, has_icon: false },
            ]
        )),
        getCounters: vi.fn(async () => ([
          { kind: 'cat', id: -1, counter: 0, auxcounter: 0 },
          { kind: 'cat', id: 10, counter: 123, auxcounter: 0 },
          { kind: 'feed', id: -1, counter: 0, auxcounter: 5 },
          { kind: 'feed', id: -2, counter: 0, auxcounter: 6 },
          { kind: 'feed', id: 100, counter: 8, auxcounter: 0 },
        ])),
        getFeedIconUrl: vi.fn((id: number) => `/public.php?op=feed_icon&id=${id}`),
      },
    }),
  };
});

import { useFeeds } from './useFeeds';

describe('useFeeds', () => {
  beforeEach(() => {
    vi.useRealTimers();
  });

  it('fetches categories/feeds and keeps category unread untouched on counters refresh', async () => {
    const { result } = renderHook(() => useFeeds());

    await waitFor(() => {
      expect(result.current.treeData.length).toBeGreaterThan(0);
    });

    await act(async () => {
      await result.current.refetchCounters();
    });

    await waitFor(() => {
      const newsCat = result.current.treeData.find(c => c.id === 10)!;
      expect(newsCat.unread).toBe(5);
      const techFeed = newsCat.feeds.find(f => f.id === 100)!;
      expect(techFeed.unread).toBe(8);
    });
  });

  it('increment/decrement unread does not alter category unread', async () => {
    const { result } = renderHook(() => useFeeds());
    await waitFor(() => {
      expect(result.current.treeData.length).toBeGreaterThan(0);
    });

    const newsCatBefore = result.current.treeData.find(c => c.id === 10)!;
    const beforeUnread = newsCatBefore.unread;

    act(() => {
      result.current.incrementUnreadCount(100);
    });

    await waitFor(() => {
      const afterIncCat = result.current.treeData.find(c => c.id === 10)!;
      expect(afterIncCat.unread).toBe(beforeUnread);
    });

    act(() => {
      result.current.decrementUnreadCount(100);
    });

    await waitFor(() => {
      const afterDecCat = result.current.treeData.find(c => c.id === 10)!;
      expect(afterDecCat.unread).toBe(beforeUnread);
    });
  });
});
