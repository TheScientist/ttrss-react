import React, { useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { debounce } from '@mui/material/utils';
import { useHeadlinesContext } from '../contexts/HeadlinesContext';
import { useSelection } from '../contexts/SelectionContext';
import { useFeeds } from '../hooks/useFeeds';
import {
  List, ListItem, ListItemButton, ListItemText, CircularProgress, Typography, Box, 
  Collapse, Avatar, Toolbar, IconButton, Tooltip
} from '@mui/material';
import { Mail, MailOutline, Star, StarOutline, Share, Public } from '@mui/icons-material';
import ArticleRenderer from './ArticleRenderer';
import SwipeableListItem from './SwipeableListItem';
import type { ApiArticle } from '../api/types';
import { findFeedInfoInTree } from '../utils/feedUtils';
import { useSettings } from '../contexts/SettingsContext';

// Format timestamp according to browser's locale, without seconds
const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp * 1000);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleString(undefined, options);
};

const HeadlineList: React.FC = () => {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const articleRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const { headlines, isLoading, isLoadingMore, hasMore, error, loadMore, markArticleAsRead, markArticleAsStarred, fetchArticleContent, markArticleAsPublished } = useHeadlinesContext();
  const { selectedArticleId, setSelectedArticleId } = useSelection();
  // Refs to avoid reattaching scroll listeners on every state change
  const headlinesRef = useRef(headlines);
  const markArticleAsReadRef = useRef(markArticleAsRead);
  const selectedArticleIdRef = useRef(selectedArticleId);
  const isLoadingRef = useRef(isLoading);
  const isLoadingMoreRef = useRef(isLoadingMore);
  const { treeData } = useFeeds();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const listContainerRef = useRef<HTMLUListElement | null>(null);
  const scrollContainerRef = useRef<HTMLElement | Window | null>(null);
  const lastScrollTopRef = useRef<number | null>(null);
  const scrollCleanupRef = useRef<(() => void) | null>(null);
  const observerCleanupRef = useRef<(() => void) | null>(null);
  const markOnScrollRef = useRef<boolean>(true);

  // Keep markOnScroll ref in sync with settings
  useEffect(() => {
    markOnScrollRef.current = settings?.markOnScroll ?? true;
  }, [settings?.markOnScroll]);

  // Keep refs in sync
  useEffect(() => { headlinesRef.current = headlines; }, [headlines]);
  useEffect(() => { markArticleAsReadRef.current = markArticleAsRead; }, [markArticleAsRead]);
  useEffect(() => { selectedArticleIdRef.current = selectedArticleId; }, [selectedArticleId]);
  useEffect(() => { isLoadingRef.current = isLoading; }, [isLoading]);
  useEffect(() => { isLoadingMoreRef.current = isLoadingMore; }, [isLoadingMore]);
  const hasMoreRef = useRef(hasMore);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);
  const loadMoreRef = useRef(loadMore);
  useEffect(() => { loadMoreRef.current = loadMore; }, [loadMore]);

  // Compute-and-mark function (stable via useCallback, reads from refs)
  const computeAndMark = useCallback(() => {
    if (!markOnScrollRef.current) return; // feature disabled
    const headlines = headlinesRef.current;
    if (headlines.length === 0 || isLoadingRef.current || isLoadingMoreRef.current) return;

    const target = scrollContainerRef.current as HTMLElement | null;
    if (!target) return;
    const currentTop = target.scrollTop;
    if (lastScrollTopRef.current == null) {
      lastScrollTopRef.current = currentTop;
      return;
    }
    const isDown = currentTop > (lastScrollTopRef.current + 1);
    lastScrollTopRef.current = currentTop;
    if (!isDown) return;

    const visible: (ApiArticle & { rect: DOMRect })[] = [];
    const above: ApiArticle[] = [];

    const viewportRect = target.getBoundingClientRect();
    const containerTop = viewportRect.top;
    const containerBottom = viewportRect.bottom;

    headlines.forEach(article => {
      const el = articleRefs.current.get(article.id);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.bottom < containerTop) {
        above.push(article);
      } else if (rect.top < containerBottom && rect.bottom >= containerTop) {
        visible.push({ ...article, rect });
      }
    });

    visible.sort((a, b) => a.rect.top - b.rect.top);

    const toMark = new Set<number>();
    const selectedId = selectedArticleIdRef.current;
    above.forEach(a => { if (a.unread && a.id !== selectedId) toMark.add(a.id); });
    // Normal case: top 3
    visible.slice(0, 3).forEach(v => { if (v.unread && v.id !== selectedId) toMark.add(v.id); });
    // If we've reached bottom and there is no more to load, mark all visible
    const atBottom = (target.scrollTop + target.clientHeight) >= (target.scrollHeight - 2);
    if (atBottom && !hasMoreRef.current) {
      visible.forEach(v => { if (v.unread && v.id !== selectedId) toMark.add(v.id); });
    }

    if (toMark.size > 0) {
      const mark = markArticleAsReadRef.current;
      toMark.forEach(articleId => {
        const article = headlines.find(h => h.id === articleId);
        if (article) mark(article.id, article.feed_id, true);
      });
    }
  }, []);

  // Debounced handler stored in ref so we can attach/detach reliably
  const debouncedRef = useRef<ReturnType<typeof debounce> | null>(null);
  useEffect(() => {
    debouncedRef.current = debounce(computeAndMark, 200);
    return () => { debouncedRef.current?.clear(); };
  }, [computeAndMark]);

  // Callback ref to attach listeners/observer when the List mounts
  const listRefCallback = useCallback((el: HTMLUListElement | null) => {
    // Cleanup previous bindings
    if (scrollCleanupRef.current) { scrollCleanupRef.current(); scrollCleanupRef.current = null; }
    if (observerCleanupRef.current) { observerCleanupRef.current(); observerCleanupRef.current = null; }

    listContainerRef.current = el;
    if (!el) return;

    scrollContainerRef.current = el;
    lastScrollTopRef.current = el.scrollTop; // initialize

    if (!debouncedRef.current) {
      // Create if not yet initialized (ref callbacks can run before effects)
      debouncedRef.current = debounce(computeAndMark, 200);
    }
    const debounced = debouncedRef.current!;
    // Attach scroll listener only if mark-on-scroll is enabled
    if (markOnScrollRef.current) {
      el.addEventListener('scroll', debounced, { capture: true, passive: true } as any);
      scrollCleanupRef.current = () => el.removeEventListener('scroll', debounced, true);
    }
    // IntersectionObserver setup handled by a dedicated effect below
  }, []);

  // Reconfigure scroll listener when the setting toggles
  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;
    // Remove any existing listener
    if (scrollCleanupRef.current) { scrollCleanupRef.current(); scrollCleanupRef.current = null; }
    if (!markOnScrollRef.current) return;
    if (!debouncedRef.current) { debouncedRef.current = debounce(computeAndMark, 200); }
    const debounced = debouncedRef.current!;
    el.addEventListener('scroll', debounced, { capture: true, passive: true } as any);
    scrollCleanupRef.current = () => el.removeEventListener('scroll', debounced, true);
    return () => { if (scrollCleanupRef.current) { scrollCleanupRef.current(); scrollCleanupRef.current = null; } };
  }, [settings?.markOnScroll, computeAndMark]);

  // Ensure IntersectionObserver is attached when both list and sentinel are ready
  useEffect(() => {
    if (observerCleanupRef.current) { observerCleanupRef.current(); observerCleanupRef.current = null; }
    const root = listContainerRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMoreRef.current && !isLoadingRef.current && !isLoadingMoreRef.current) {
        loadMoreRef.current();
      }
    }, { root, rootMargin: '600px', threshold: 0 });
    observer.observe(sentinel);
    observerCleanupRef.current = () => observer.unobserve(sentinel);
    return () => { observerCleanupRef.current?.(); };
  }, [headlines]);

  

  const handleHeadlineClick = (articleId: number) => {
    if (selectedArticleId === articleId) {
      setSelectedArticleId(null);
    } else {
      setSelectedArticleId(articleId);
      fetchArticleContent(articleId); // Fetch full content for the article
      const article = headlines.find(h => h.id === articleId);
      if (article?.unread) {
        // Explicitly mark as read
        markArticleAsRead(article.id, article.feed_id, true);
      }

      // Smoothly scroll the selected headline to the top of the list container
      // Use rAF to ensure DOM updates (like sticky header) are applied first
      requestAnimationFrame(() => {
        const container = listContainerRef.current;
        const el = articleRefs.current.get(articleId);
        if (container && el) {
          // Sticky header top is 0 relative to the scroll container
          const targetTop = Math.max(0, el.offsetTop);
          container.scrollTo({ top: targetTop, behavior: 'smooth' });
        }
      });
    }
  };

  const handleShare = async (article: ApiArticle) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: t('share_text', { title: article.title }),
          url: article.link,
        });
      } catch (error) {
        console.error('Error sharing article:', error);
      }
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(article.link);
      alert(t('link_copied_to_clipboard'));
    }
  };

  const handlePublish = (articleId: number, published: boolean) => {
    markArticleAsPublished(articleId, published);
  };



  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Box sx={{ p: 2 }}><Typography color="error">{error}</Typography></Box>;
  }

  return (
    <React.Fragment>
    <List
      ref={listRefCallback}
      disablePadding
      sx={{ backgroundColor: 'background.paper', height: 'calc(100vh - 64px)', overflowY: 'auto' }}
    >
      {headlines.map((headline) => {
        const feedInfo = findFeedInfoInTree(headline.feed_id, treeData);
        const isSelected = selectedArticleId === headline.id;
        const displayTitle = headline.author ? `${headline.title} (${headline.author})` : headline.title;

        return (
          <ListItem
            key={headline.id}
            disablePadding
            divider
            ref={node => {
              if (node) articleRefs.current.set(headline.id, node);
              else articleRefs.current.delete(headline.id);
            }}
            data-article-id={headline.id}
            sx={{ flexDirection: 'column', alignItems: 'stretch', backgroundColor: 'inherit', overflow: 'visible' }}
          >
            {isSelected ? (
              <React.Fragment>
                <Box
                  onClick={() => handleHeadlineClick(headline.id)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    backgroundColor: 'background.paper',
                    position: 'sticky',
                    top: 0,
                    zIndex: theme => theme.zIndex.appBar - 1,
                    borderBottom: 1,
                    borderColor: 'divider',
                    px: 2,
                    py: 1,
                  }}
                >
                  <ListItemText
                    primary={displayTitle}
                    primaryTypographyProps={{ sx: { fontWeight: headline.unread ? 'bold' : 'normal', fontStyle: headline.marked ? 'italic' : 'normal', mb: 1 } }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {feedInfo?.iconUrl && (
                      <Avatar src={feedInfo.iconUrl} sx={{ width: 16, height: 16, mr: 1 }} />
                    )}
                    <Typography variant="caption" sx={{ flexGrow: 1 }}>
                      {feedInfo?.title || t('unknown_feed')}
                    </Typography>
                    <Typography variant="caption">
                      {formatTimestamp(headline.updated)}
                    </Typography>
                  </Box>
                </Box>
                <Collapse in={isSelected} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
                    <ArticleRenderer content={headline.content || ''} />
                  </Box>
                  <Toolbar disableGutters sx={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: theme => theme.zIndex.appBar - 1,
                    backgroundColor: 'background.paper',
                    borderTop: 1,
                    borderColor: 'divider',
                    justifyContent: 'flex-end',
                    padding: '0 8px',
                  }}>
                    <Tooltip title={t('toggle_read')}>
                      <IconButton onClick={(e) => {
                        e.stopPropagation();
                        const currentArticle = headlines.find(h => h.id === headline.id);
                        if (currentArticle) {
                          markArticleAsRead(currentArticle.id, currentArticle.feed_id, currentArticle.unread);
                        }
                      }}>
                        {headline.unread ? <Mail /> : <MailOutline />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('toggle_star')}>
                      <IconButton onClick={(e) => { e.stopPropagation(); markArticleAsStarred(headline.id, !headline.marked); }}>
                        {headline.marked ? <Star /> : <StarOutline />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('share_article')}>
                      <IconButton onClick={(e) => { e.stopPropagation(); handleShare(headline); }}>
                        <Share />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t('toggle_publish')}>
                      <IconButton onClick={(e) => { e.stopPropagation(); handlePublish(headline.id, !headline.published); }}>
                        <Public />
                      </IconButton>
                    </Tooltip>
                  </Toolbar>
                </Collapse>
              </React.Fragment>
            ) : (
              <SwipeableListItem
                onSwipeLeft={() => markArticleAsRead(headline.id, headline.feed_id, headline.unread)}
                onSwipeRight={() => markArticleAsStarred(headline.id, !headline.marked)}
              >
                <ListItemButton
                  disableRipple
                  disableTouchRipple
                  component="div"
                  onClick={() => handleHeadlineClick(headline.id)}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    backgroundColor: 'background.paper',
                  }}
                >
                  <ListItemText
                    primary={displayTitle}
                    primaryTypographyProps={{ sx: { fontWeight: headline.unread ? 'bold' : 'normal', fontStyle: headline.marked ? 'italic' : 'normal', mb: 1 } }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {feedInfo?.iconUrl && (
                      <Avatar src={feedInfo.iconUrl} sx={{ width: 16, height: 16, mr: 1 }} />
                    )}
                    <Typography variant="caption" sx={{ flexGrow: 1 }}>
                      {feedInfo?.title || t('unknown_feed')}
                    </Typography>
                    <Typography variant="caption">
                      {formatTimestamp(headline.updated)}
                    </Typography>
                  </Box>
                </ListItemButton>
              </SwipeableListItem>
            )}
          </ListItem>
        );
      })}
      {hasMore && (
        <ListItem disablePadding sx={{ p: 0, m: 0, height: 0, minHeight: 0 }}>
          <Box ref={sentinelRef} sx={{ display: 'block', height: 1, width: '100%', overflow: 'hidden' }} />
        </ListItem>
      )}
      </List>
      {isLoadingMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </React.Fragment>
  );
};

export default HeadlineList;
