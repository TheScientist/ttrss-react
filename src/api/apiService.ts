import axios, { type AxiosInstance } from 'axios';
import type { Settings } from '../types/settings';
import type {
  ApiRequest,
  ApiResponse,
  LoginResponse,
  ApiCategory,
  ApiFeed,
  ApiArticle,
  ApiCounterItem,
} from './types';

class ApiService {
  private static instance: ApiService;
  private apiClient: AxiosInstance | null = null;
  private sid: string | null = null;

  private constructor() {}

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  public async login(settings: Settings): Promise<boolean> {
    this.apiClient = axios.create({ baseURL: settings.apiUrl });
    try {
      const response = await this.request<LoginResponse>({
        op: 'login',
        user: settings.username,
        password: settings.password,
      });
      this.sid = response.content.session_id;
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      this.sid = null;
      return false;
    }
  }

  public isLoggedIn(): boolean {
    return !!this.sid;
  }

  private async request<T>(data: ApiRequest): Promise<ApiResponse<T>> {
    if (!this.apiClient) {
      throw new Error('API client not initialized. Please login first.');
    }

    const requestData = { ...data };
    if (this.sid && data.op !== 'login') {
      requestData.sid = this.sid;
    }

    const response = await this.apiClient.post<ApiResponse<T>>('', requestData);
    if (response.data.status !== 0) {
      throw new Error(`API Error: ${response.data.content}`);
    }
    return response.data;
  }

  public async getCategories(): Promise<ApiCategory[]> {
    const response = await this.request<ApiCategory[]>({
      op: 'getCategories',
      unread_only: false,
    });
    return response.content;
  }

  public async getCounters(): Promise<ApiCounterItem[]> {
    const response = await this.request<ApiCounterItem[]>({
      op: 'getCounters',
    });
    return response.content;
  }

  public async getFeeds(categoryId: number): Promise<ApiFeed[]> {
    const response = await this.request<ApiFeed[]>({
      op: 'getFeeds',
      cat_id: categoryId,
    });
    return response.content;
  }

  public async getArticle(articleId: number): Promise<ApiArticle> {
    const response = await this.request<ApiArticle[]>({ op: 'getArticle', article_id: articleId });
    if (response.content && response.content.length > 0) {
      const article = response.content[0];
      return {
        ...article,
        updated: parseInt(article.updated as any, 10),
      };
    }
    throw new Error('Article not found');
  }

  public async getHeadlines(
    feedId: number,
    isCategory: boolean = false,
    options?: { limit?: number; skip?: number }
  ): Promise<ApiArticle[]> {
    const response = await this.request<ApiArticle[]>({
      op: 'getHeadlines',
      feed_id: feedId,
      is_cat: isCategory,
      view_mode: 'all_articles',
      order_by: 'feed_dates',
      show_content: false, // Important: we don't fetch full content for list
      ...(options?.limit != null ? { limit: options.limit } : {}),
      ...(options?.skip != null ? { skip: options.skip } : {}),
    });
    return response.content.map((article) => ({
      ...article,
      updated: parseInt(article.updated as any, 10),
    }));
  }

  private async updateArticle(articleId: number, field: number, mode: number): Promise<void> {
    await this.request({
      op: 'updateArticle',
      article_ids: `${articleId}`,
      mode,
      field,
    });
  }

  public async markArticleAsRead(articleId: number, read = true): Promise<void> {
    await this.updateArticle(articleId, 2, read ? 0 : 1); // field=2 (unread), mode=0 (set unread to false -> article is read), mode=1 (set unread to true -> article is unread)
  }

  public async markArticleAsStarred(articleId: number, starred: boolean): Promise<void> {
    await this.updateArticle(articleId, 0, starred ? 1 : 0); // field=0 (starred), mode=1 (true) or 0 (false)
  }

  public async markArticleAsPublished(articleId: number, published: boolean): Promise<void> {
    await this.updateArticle(articleId, 1, published ? 1 : 0); // field=1 (published), mode=1 (true) or 0 (false)
  }

  public async catchupFeed(feedId: number, isCategory: boolean = false): Promise<void> {
    await this.request({
      op: 'catchupFeed',
      feed_id: feedId,
      is_cat: isCategory,
    });
  }

  public getFeedIconUrl(feedId: number): string {
    if (this.apiClient?.defaults.baseURL) {
      // Assuming baseURL is like https://example.com/tt-rss/api/, we want https://example.com/tt-rss/
      const baseUrl = this.apiClient.defaults.baseURL.replace(/api\/?$/, '');
      return `${baseUrl}public.php?op=feed_icon&id=${feedId}`;
    }
    // Fallback for when API client is not initialized
    return `/public.php?op=feed_icon&id=${feedId}`;
  }
}

export default ApiService.getInstance();
