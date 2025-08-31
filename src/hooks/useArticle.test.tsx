import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act, rerender } from '@testing-library/react';
import { useArticle } from './useArticle';

// Mocks for contexts used by the hook
const decrementUnreadCount = vi.fn();
vi.mock('../contexts/FeedContext', () => ({
  useFeedContext: () => ({ decrementUnreadCount }),
}));
const setHeadlineUnreadStatus = vi.fn();
vi.mock('../contexts/HeadlinesContext.tsx', () => ({
  useHeadlinesContext: () => ({ setHeadlineUnreadStatus }),
}));

// Mock apiService
vi.mock('../api/apiService', () => ({
  default: {
    getArticle: vi.fn(),
    markArticleAsRead: vi.fn(),
  },
}));
import apiService from '../api/apiService';

const Consumer = ({ id }: { id: number | null }) => {
  const { article, isLoading, error } = useArticle(id);
  return (
    <div>
      <div>loading:{String(isLoading)}</div>
      <div>error:{error ?? ''}</div>
      <div>aid:{article?.id ?? ''}</div>
      <div>unread:{article?.unread === undefined ? '' : String(article.unread)}</div>
    </div>
  );
};

describe('useArticle', () => {
  it('returns null when no articleId', async () => {
    render(<Consumer id={null} />);
    // no loading; article null
    expect(screen.getByText('loading:false')).toBeInTheDocument();
    expect(screen.getByText('aid:')).toBeInTheDocument();
  });

  it('fetches article and marks read when unread', async () => {
    (apiService.getArticle as any).mockResolvedValueOnce({ id: 100, feed_id: 2, unread: true });
    (apiService.markArticleAsRead as any).mockResolvedValueOnce(undefined);

    render(<Consumer id={100} />);

    // loading true will briefly flash, wait until final state visible
    await screen.findByText('loading:false');
    expect(screen.getByText('aid:100')).toBeInTheDocument();
    // Hook sets unread false after marking read
    expect(screen.getByText('unread:false')).toBeInTheDocument();

    expect(apiService.getArticle).toHaveBeenCalledWith(100);
    expect(apiService.markArticleAsRead).toHaveBeenCalledWith(100);
    expect(setHeadlineUnreadStatus).toHaveBeenCalledWith(100, false);
    expect(decrementUnreadCount).toHaveBeenCalledWith(2);
  });

  it('handles fetch error', async () => {
    (apiService.getArticle as any).mockRejectedValueOnce(new Error('boom'));

    render(<Consumer id={5} />);

    await screen.findByText('loading:false');
    expect(screen.getByText('error:Failed to fetch article.')).toBeInTheDocument();
  });
});
