import React from 'react';
import { useArticle } from '../hooks/useArticle';
import { Box, CircularProgress, Typography } from '@mui/material';

interface ArticleRendererProps {
  articleId: number;
}

const ArticleRenderer: React.FC<ArticleRendererProps> = ({ articleId }) => {
  const { article, isLoading, error } = useArticle(articleId);

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

  if (!article) {
    return null;
  }

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        {article.title}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {article.author}
      </Typography>
      <Box
        sx={{
          '& img': { maxWidth: '100%', height: 'auto' },
          '& a': { color: 'primary.main' },
        }}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </Box>
  );
};

export default ArticleRenderer;
