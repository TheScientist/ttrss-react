import React, { useEffect, useRef } from 'react';
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
  const articleRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const { headlines, isLoading, error, markArticleAsRead, markArticleAsStarred, fetchArticleContent, markArticleAsPublished } = useHeadlinesContext();
  const { selectedArticleId, setSelectedArticleId } = useSelection();
  const { treeData } = useFeeds();

  // Scroll-to-mark-as-read logic (kept from previous implementation)
  useEffect(() => {
    const handleScroll = debounce(() => {
      if (headlines.length === 0 || selectedArticleId) return;

      const articlesToMark = new Set<number>();
      const articlesAboveViewport: ApiArticle[] = [];
      const articlesInViewport: (ApiArticle & { rect: DOMRect })[] = [];

      headlines.forEach(article => {
        const el = articleRefs.current.get(article.id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.bottom < 0) {
          articlesAboveViewport.push(article);
        } else if (rect.top < window.innerHeight && rect.bottom >= 0) {
          articlesInViewport.push({ ...article, rect });
        }
      });

      articlesAboveViewport.forEach(article => {
        if (article.unread) articlesToMark.add(article.id);
      });

      articlesInViewport.sort((a, b) => a.rect.top - b.rect.top);
      articlesInViewport.slice(0, 2).forEach(article => {
        if (article.unread) articlesToMark.add(article.id);
      });

      if (articlesToMark.size > 0) {
        articlesToMark.forEach(articleId => {
          const article = headlines.find(h => h.id === articleId);
          if (article) markArticleAsRead(article.id, article.feed_id, true);
        });
      }
    }, 300);

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      handleScroll.clear();
    };
  }, [headlines, markArticleAsRead, selectedArticleId]);

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
    <List disablePadding sx={{ backgroundColor: 'background.paper' }}>
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
            sx={{ flexDirection: 'column', alignItems: 'stretch', backgroundColor: 'inherit' }}
          >
            {isSelected ? (
              <React.Fragment>
                <SwipeableListItem disabled={true}>
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
                      position: 'sticky',
                      top: 64, // AppBar height
                      zIndex: 1100, // Above other content
                      borderBottom: 1,
                      borderColor: 'divider',
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
                <Collapse in={isSelected} timeout="auto" unmountOnExit>
                  <Box sx={{ p: 2, backgroundColor: 'background.paper' }}>
                    <ArticleRenderer content={headline.content || ''} />
                  </Box>
                  <Toolbar disableGutters sx={{
                    position: 'sticky',
                    bottom: 0,
                    zIndex: 1,
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
      </List>
    </React.Fragment>
  );
};

export default HeadlineList;
