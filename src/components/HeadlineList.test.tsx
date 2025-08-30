import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Mock contexts/hooks used by HeadlineList
vi.mock('../contexts/HeadlinesContext', () => ({
  useHeadlinesContext: () => ({
    headlines: [
      { id: 1, feed_id: 100, title: 'First headline', author: '', unread: true, marked: false, updated: 1700000000 },
      { id: 2, feed_id: 100, title: 'Second headline', author: '', unread: true, marked: false, updated: 1700001000 },
    ],
    isLoading: false,
    isLoadingMore: false,
    hasMore: false,
    error: null,
    loadMore: vi.fn(),
    markArticleAsRead: vi.fn(),
    markArticleAsStarred: vi.fn(),
    markArticleAsPublished: vi.fn(),
    fetchArticleContent: vi.fn(),
    setHeadlineUnreadStatus: vi.fn(),
  }),
}));

vi.mock('../contexts/SelectionContext', () => ({
  useSelection: () => ({
    selection: { id: 100, isCategory: false },
    setSelection: vi.fn(),
    selectedArticleId: 1,
    setSelectedArticleId: vi.fn(),
  }),
}));

vi.mock('../hooks/useFeeds', () => ({
  useFeeds: () => ({
    treeData: [
      { id: 10, title: 'News', unread: 0, feeds: [{ id: 100, title: 'Tech', unread: 0, iconUrl: '' }] },
    ],
  }),
}));

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { markOnScroll: false } }),
}));

// Make SwipeableListItem an obvious wrapper to detect in DOM for non-selected items
vi.mock('./SwipeableListItem', () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="swipe-wrapper">{children}</div>
  ),
}));

import HeadlineList from './HeadlineList';

describe('HeadlineList', () => {
  beforeEach(() => {
    // Ensure raf executes immediately in tests
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 1 as any;
    });
  });

  it('renders selected headline as plain item (no swipe wrapper) and non-selected inside swipe wrapper', () => {
    render(<HeadlineList />);

    const selectedTitle = screen.getByText('First headline');
    const selectedSwipeWrapper = selectedTitle.closest('[data-testid="swipe-wrapper"]');
    expect(selectedSwipeWrapper).toBeNull();

    // Non-selected item should be wrapped by swipe wrapper
    const nonSelected = screen.getByText('Second headline');
    const swipeWrapper = nonSelected.closest('[data-testid="swipe-wrapper"]');
    expect(swipeWrapper).not.toBeNull();
  });

  it('scrolls to exact element offset when clicking a non-selected headline', () => {
    render(<HeadlineList />);

    const list = screen.getByRole('list');
    // Spy scrollTo
    (list as any).scrollTo = vi.fn();

    const second = screen.getByText('Second headline');
    const li = second.closest('li') as HTMLElement;
    // Mock offsetTop
    Object.defineProperty(li, 'offsetTop', { value: 200, configurable: true });

    fireEvent.click(second);

    expect((list as any).scrollTo).toHaveBeenCalledWith({ top: 200, behavior: 'smooth' });
  });
});
