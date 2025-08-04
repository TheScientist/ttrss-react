import React from 'react';
import { useHeadlinesContext } from '../contexts/HeadlinesContext';
import { useSelection } from '../contexts/SelectionContext';
import { useFeeds } from '../hooks/useFeeds';
import { List, ListItem, ListItemButton, ListItemText, CircularProgress, Typography, Box, Paper, Collapse, Avatar } from '@mui/material';
import ArticleRenderer from './ArticleRenderer';

// Format timestamp according to browser's locale
const formatTimestamp = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString();
};

const HeadlineList: React.FC = () => {
  const { headlines, isLoading, error } = useHeadlinesContext();
  const { selectedArticleId, setSelectedArticleId, selection } = useSelection();
  const { treeData } = useFeeds();
  
  // Find feed info for a specific feed ID
  const getFeedInfo = (feedId: number) => {
    if (!treeData) return null;
    
    // Check all categories and their feeds
    for (const category of treeData) {
      // Check if this is the feed we're looking for
      const feed = category.feeds.find(f => f.id === feedId);
      if (feed) {
        return {
          title: feed.title,
          iconUrl: feed.iconUrl,
        };
      }
    }
    
    return null;
  };
  
  // Check if we should show feed info (for categories and special feeds)
  const shouldShowFeedInfo = selection && (selection.isCategory || selection.id <= 0);

  const handleHeadlineClick = (articleId: number) => {
    if (selectedArticleId === articleId) {
      setSelectedArticleId(null); // Collapse if the same headline is clicked again
    } else {
      setSelectedArticleId(articleId);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (headlines.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>Select a feed to see headlines.</Typography>
      </Box>
    );
  }

  return (
    <Paper>
      <List>
                {headlines.map((article) => (
          <React.Fragment key={article.id}>
            <ListItemButton onClick={() => handleHeadlineClick(article.id)}>
              <ListItemText
                primary={article.title}
                secondary={
                  <Box>
                    <Box component="span">
                      {article.author && article.author.trim() !== '' ? (
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {article.author}
                          </Typography>
                          {' • '}
                        </>
                      ) : null}
                      <Typography component="span" variant="body2" color="text.secondary">
                        {formatTimestamp(article.updated)}
                      </Typography>
                    </Box>
                    {shouldShowFeedInfo && (() => {
                      const feedInfo = getFeedInfo(article.feed_id);
                      if (!feedInfo) return null;
                      
                      return (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                          {feedInfo.iconUrl && (
                            <Avatar 
                              src={feedInfo.iconUrl} 
                              sx={{ 
                                width: 14, 
                                height: 14, 
                                mr: 0.5,
                                '& .MuiAvatar-img': {
                                  objectFit: 'contain'
                                }
                              }}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {feedInfo.title}
                          </Typography>
                        </Box>
                      );
                    })()}
                  </Box>
                }
                primaryTypographyProps={{
                  style: {
                    fontWeight: article.unread ? 'bold' : 'normal',
                  },
                }}
                secondaryTypographyProps={{ component: 'div' }}
              />

            </ListItemButton>
            <Collapse in={selectedArticleId === article.id} timeout="auto" unmountOnExit>
              <ListItem>
                <ArticleRenderer articleId={article.id} />
              </ListItem>
            </Collapse>
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default HeadlineList;
