import React, { useMemo } from 'react';
import { Box } from '@mui/material';

interface ArticleRendererProps {
  content: string;
}

const ArticleRenderer: React.FC<ArticleRendererProps> = ({ content }) => {
  // Sanitize content to prevent mixed content warnings by replacing http with https
  const sanitizedContent = useMemo(() => {
    return content.replace(/(src|href)="http:\/\//g, '$1="https://');
  }, [content]);

  return (
    <Box
      sx={{
        '& img': { maxWidth: '100%', height: 'auto' },
        '& a': { color: 'primary.main' },
        lineHeight: 1.6,
      }}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default ArticleRenderer;
