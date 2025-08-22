import React from 'react';
import { Box } from '@mui/material';

interface ArticleRendererProps {
  content: string;
}

const ArticleRenderer: React.FC<ArticleRendererProps> = ({ content }) => {
  return (
    <Box
      sx={{
        '& img': { maxWidth: '100%', height: 'auto' },
        '& a': { color: 'primary.main' },
        lineHeight: 1.6,
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default ArticleRenderer;
