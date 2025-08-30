import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiService from './apiService';

// Mock axios
vi.mock('axios', async () => {
  const actual: any = await vi.importActual('axios');
  const post = vi.fn();
  // baseURL value is not relevant for the first test
  const create = vi.fn((cfg?: any) => ({ defaults: { baseURL: cfg?.baseURL ?? '/api/' }, post }));
  const axiosMock = { ...actual, default: { create }, create, post } as any;
  return axiosMock;
});

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // reset singleton internal state between tests
    (apiService as any).sid = null;
    (apiService as any).apiClient = null;
    (apiService as any).serverRoot = null;
  });

  it('builds absolute icon URL from the provided settings server root', async () => {
    const axiosModule: any = await import('axios');
    const post = axiosModule.post as ReturnType<typeof vi.fn>;
    post.mockResolvedValueOnce({ data: { status: 0, content: { session_id: 'sid123' } } });

    const ok = await apiService.login({
      apiUrl: 'https://example.com/tt-rss/api/',
      username: 'u',
      password: 'p',
    } as any);

    expect(ok).toBe(true);

    const iconUrl = apiService.getFeedIconUrl(42);
    expect(iconUrl).toBe('https://example.com/tt-rss/public.php?op=feed_icon&id=42');
  });

  it('uses the absolute server root from settings to build icon URLs (non-dev)', async () => {
    const axiosModule: any = await import('axios');
    const post = axiosModule.post as ReturnType<typeof vi.fn>;
    post.mockResolvedValueOnce({ data: { status: 0, content: { session_id: 'sid456' } } });

    const ok = await apiService.login({
      apiUrl: 'https://foo.bar/api/',
      username: 'u',
      password: 'p',
    } as any);

    expect(ok).toBe(true);
    const iconUrl = apiService.getFeedIconUrl(7);
    expect(iconUrl).toBe('https://foo.bar/public.php?op=feed_icon&id=7');
  });
});
