import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';

// Mocks for contexts used by the hook
vi.mock('../contexts/SelectionContext.tsx', () => ({
  useSelection: () => ({ selection: { id: 10, isCategory: false } }),
}));
vi.mock('../contexts/SettingsContext.tsx', () => ({
  useSettings: () => ({ isApiReady: true }),
}));

const incrementUnreadCount = vi.fn();
const decrementUnreadCount = vi.fn();
const refetchCounters = vi.fn().mockResolvedValue(undefined);
const adjustSpecialCounter = vi.fn();

vi.mock('../contexts/FeedContext.tsx', () => ({
  useFeedContext: () => ({ incrementUnreadCount, decrementUnreadCount, refetchCounters, adjustSpecialCounter }),
}));

// Mock apiService
vi.mock('../api/apiService', () => ({
  __esModule: true,
  default: {
    getHeadlines: vi.fn(),
    getArticle: vi.fn(),
    markArticleAsRead: vi.fn(),
    catchupFeed: vi.fn(),
    markArticleAsStarred: vi.fn(),
    markArticleAsPublished: vi.fn(),
  },
}));
import apiService from '../api/apiService';
import { useHeadlines } from './useHeadlines';

const TestComponent = () => {
  const {
    headlines,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    markArticleAsRead,
    markFeedAsRead,
    markArticleAsStarred,
    fetchArticleContent,
    markArticleAsPublished,
  } = useHeadlines();

  return React.createElement(
    'div',
    null,
    React.createElement('div', null, `loading:${String(isLoading)}`),
    React.createElement('div', null, `moreLoading:${String(isLoadingMore)}`),
    React.createElement('div', null, `hasMore:${String(hasMore)}`),
    React.createElement('div', null, `error:${error ?? ''}`),
    React.createElement('div', null, `count:${(headlines || []).length}`),
    React.createElement('button', { onClick: () => loadMore() }, 'more'),
    React.createElement(
      'button',
      { onClick: () => markArticleAsRead(headlines[0]?.id ?? 0, headlines[0]?.feed_id ?? 0, true) },
      'read'
    ),
    React.createElement('button', { onClick: () => markFeedAsRead(1, false) }, 'catchup'),
    React.createElement('button', { onClick: () => markArticleAsStarred(headlines[0]?.id ?? 0, true) }, 'star'),
    React.createElement('button', { onClick: () => markArticleAsPublished(headlines[0]?.id ?? 0, true) }, 'pub'),
    React.createElement('button', { onClick: () => fetchArticleContent(headlines[0]?.id ?? 0) }, 'fetchContent')
  );
};

describe.skip('useHeadlines', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Safe defaults to avoid undefined leading to runtime errors in the hook
    (apiService.getHeadlines as any).mockResolvedValue([]);
    (apiService.getArticle as any).mockResolvedValue({});
    (apiService.markArticleAsRead as any).mockResolvedValue(undefined);
    (apiService.catchupFeed as any).mockResolvedValue(undefined);
    (apiService.markArticleAsStarred as any).mockResolvedValue(undefined);
    (apiService.markArticleAsPublished as any).mockResolvedValue(undefined);
  });

  it('fetches initial headlines and handles pagination', async () => {
    const firstPage = Array.from({ length: 20 }, (_, i) => ({ id: i + 1, feed_id: 2, title: `t${i + 1}`, unread: i % 2 === 0 }));
    (apiService.getHeadlines as any)
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce([{ id: 21, feed_id: 2, title: 't21', unread: true }]);

    render(React.createElement(TestComponent));

    // Initial load: full page -> hasMore true
    await screen.findByText('count:20');
    expect(screen.getByText('hasMore:true')).toBeInTheDocument();

    // Load more appends one and flips hasMore to false
    await act(async () => {
      fireEvent.click(screen.getByText('more'));
    });
    expect(screen.getByText('count:21')).toBeInTheDocument();
    expect(screen.getByText('hasMore:false')).toBeInTheDocument();
  });

  it('marks article read optimistically and calls api', async () => {
    (apiService.getHeadlines as any).mockResolvedValueOnce([{ id: 11, feed_id: 5, title: 't', unread: true }]);
    (apiService.markArticleAsRead as any).mockResolvedValueOnce(undefined);

    render(React.createElement(TestComponent));
    await screen.findByText('count:1');

    await act(async () => {
      fireEvent.click(screen.getByText('read'));
    });

    expect(apiService.markArticleAsRead).toHaveBeenCalledWith(11, true);
    expect(decrementUnreadCount).toHaveBeenCalledWith(5);
  });

  it('catchup and star/publish call respective APIs and counters', async () => {
    (apiService.getHeadlines as any).mockResolvedValueOnce([{ id: 21, feed_id: 7, title: 't', unread: true }]);
    (apiService.catchupFeed as any).mockResolvedValueOnce(undefined);
    (apiService.markArticleAsStarred as any).mockResolvedValueOnce(undefined);
    (apiService.markArticleAsPublished as any).mockResolvedValueOnce(undefined);

    render(React.createElement(TestComponent));
    await screen.findByText('count:1');

    await act(async () => {
      fireEvent.click(screen.getByText('catchup'));
      fireEvent.click(screen.getByText('star'));
      fireEvent.click(screen.getByText('pub'));
    });

    expect(apiService.catchupFeed).toHaveBeenCalledWith(1, false);
    expect(apiService.markArticleAsStarred).toHaveBeenCalledWith(21, true);
    expect(apiService.markArticleAsPublished).toHaveBeenCalledWith(21, true);
    expect(adjustSpecialCounter).toHaveBeenCalled();
  });

  it('fetchArticleContent fetches content when missing', async () => {
    (apiService.getHeadlines as any).mockResolvedValueOnce([{ id: 31, feed_id: 9, title: 't', unread: false }]);
    (apiService.getArticle as any).mockResolvedValueOnce({ id: 31, feed_id: 9, content: '<p>full</p>' });

    render(React.createElement(TestComponent));
    await screen.findByText('count:1');

    await act(async () => {
      fireEvent.click(screen.getByText('fetchContent'));
    });

    expect(apiService.getArticle).toHaveBeenCalledWith(31);
  });
});
