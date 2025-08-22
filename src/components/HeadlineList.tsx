import React, { useEffect, useRef } from 'react';
import { debounce } from '@mui/material/utils';
import { useHeadlinesContext } from '../contexts/HeadlinesContext';
import { useSelection } from '../contexts/SelectionContext';
import { useFeeds } from '../hooks/useFeeds';
import {
  List, ListItem, ListItemButton, ListItemText, CircularProgress, Typography, Box, 
  Collapse, Avatar, Toolbar, IconButton
} from '@mui/material';
import { Mail, MailOutline, Star, StarOutline } from '@mui/icons-material';
import ArticleRenderer from './ArticleRenderer';
import type { ApiArticle } from '../api/types';
import { findFeedInfoInTree } from '../utils/feedUtils';

// Format timestamp according to browser's locale
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

const HeadlineList: React.FC = () => {
  const articleRefs = useRef<Map<number, HTMLLIElement>>(new Map());
  const { headlines, isLoading, error, markArticleAsRead, markArticleAsStarred, fetchArticleContent } = useHeadlinesContext();
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



  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Box sx={{ p: 2 }}><Typography color="error">{error}</Typography></Box>;
  }

  return (
    <List disablePadding sx={{ backgroundColor: 'background.paper' }}>
      {headlines.map((headline) => {
        const feedInfo = findFeedInfoInTree(headline.feed_id, treeData);
        const isSelected = selectedArticleId === headline.id;

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
            sx={{ flexDirection: 'column', alignItems: 'stretch' }}
          >
            <ListItemButton
              onClick={() => handleHeadlineClick(headline.id)}
              sx={{
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'flex-start',
                ...(isSelected && {
                  position: 'sticky',
                  top: 64,
                  zIndex: 1,
                  backgroundColor: 'background.paper',
                  borderBottom: 1,
                  borderColor: 'divider',
                })
              }}
            >
              <ListItemText
                primary={headline.title}
                primaryTypographyProps={{ sx: { fontWeight: headline.unread ? 'bold' : 'normal', mb: 1 } }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {feedInfo?.iconUrl && (
                  <Avatar src={feedInfo.iconUrl} sx={{ width: 16, height: 16, mr: 1 }} />
                )}
                <Typography variant="caption" sx={{ flexGrow: 1 }}>
                  {feedInfo?.title || 'Unknown Feed'}
                </Typography>
                <Typography variant="caption">
                  {formatTimestamp(headline.updated)}
                </Typography>
              </Box>
            </ListItemButton>
            <Collapse in={isSelected} timeout="auto" unmountOnExit>
              <Box sx={{ p: 2 }}>
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
                <IconButton onClick={(e) => {
                  e.stopPropagation();
                  // Get the latest state of the article directly from the context to avoid stale closures
                  const currentArticle = headlines.find(h => h.id === headline.id);
                  if (currentArticle) {
                    markArticleAsRead(currentArticle.id, currentArticle.feed_id, currentArticle.unread);
                  }
                }}>
                  {headline.unread ? <Mail /> : <MailOutline />}
                </IconButton>
                <IconButton onClick={(e) => { e.stopPropagation(); markArticleAsStarred(headline.id, !headline.marked); }}>
                  {headline.marked ? <Star /> : <StarOutline />}
                </IconButton>
              </Toolbar>
            </Collapse>
          </ListItem>
        );
      })}
    </List>
  );
};

export default HeadlineList;
