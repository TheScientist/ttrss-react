import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

// Track selectedArticleId and headlines for dynamic mocking
let mockSelectedArticleId = 1;
let mockHeadlines = [
  { id: 1, feed_id: 100, title: 'First headline', author: '', unread: true, marked: false, updated: 1700000000, content: 'loaded content' },
  { id: 2, feed_id: 100, title: 'Second headline', author: '', unread: true, marked: false, updated: 1700001000, content: 'loaded content' },
];

// Mock contexts/hooks used by HeadlineList
vi.mock('../contexts/HeadlinesContext', () => ({
  useHeadlinesContext: () => ({
    headlines: mockHeadlines,
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
    selectedArticleId: mockSelectedArticleId,
    setSelectedArticleId: (id: number) => {
      mockSelectedArticleId = id;
    },
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
    // Reset mock state
    mockSelectedArticleId = 1;
    mockHeadlines = [
      { id: 1, feed_id: 100, title: 'First headline', author: '', unread: true, marked: false, updated: 1700000000, content: 'loaded content' },
      { id: 2, feed_id: 100, title: 'Second headline', author: '', unread: true, marked: false, updated: 1700001000, content: 'loaded content' },
    ];
    
    // Mock scrollTo on HTMLUListElement since test DOM doesn't have it
    if (!HTMLUListElement.prototype.scrollTo) {
      HTMLUListElement.prototype.scrollTo = vi.fn();
    }
    
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
    const { rerender } = render(<HeadlineList />);

    const list = screen.getByRole('list') as HTMLUListElement;
    // Set up spy to track scrollTo calls
    const scrollToSpy = vi.spyOn(list, 'scrollTo');

    const second = screen.getByText('Second headline');
    const li = second.closest('li') as HTMLElement;
    // Mock offsetTop
    Object.defineProperty(li, 'offsetTop', { value: 200, configurable: true });

    // Click the second headline
    fireEvent.click(second);
    
    // Re-render to trigger the scroll effect with updated selectedArticleId
    rerender(<HeadlineList />);

    // Verify scrollTo was called with the correct offset
    expect(scrollToSpy).toHaveBeenCalledWith({ top: 200, behavior: 'smooth' });
  });

  it('does not scroll back to the top while an article stays open and headlines update', () => {
    const { rerender } = render(<HeadlineList />);

    mockSelectedArticleId = 2;
    rerender(<HeadlineList />);

    const list = screen.getByRole('list') as HTMLUListElement;
    const scrollToSpy = vi.spyOn(list, 'scrollTo');

    const li = screen.getByText('Second headline').closest('li') as HTMLElement;
    Object.defineProperty(li, 'offsetTop', { value: 200, configurable: true });

    scrollToSpy.mockClear();
    mockHeadlines = mockHeadlines.map(article => article.id === 2 ? { ...article, unread: false } : article);
    rerender(<HeadlineList />);

    expect(scrollToSpy).not.toHaveBeenCalled();
  });
});
