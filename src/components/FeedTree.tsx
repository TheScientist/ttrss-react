import React, { useState, useEffect } from 'react';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { useTreeViewApiRef } from '@mui/x-tree-view';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useFeedContext } from '../contexts/FeedContext.tsx';
import { useSelection } from '../contexts/SelectionContext.tsx';
import { Box, CircularProgress, Typography, Avatar, Icon, Badge } from '@mui/material';

const FeedTree: React.FC = () => {
  const { treeData, isLoading, error } = useFeedContext();
  const { selection, setSelection } = useSelection();
  const [expanded, setExpanded] = useState<string[]>([]);
    const apiRef = useTreeViewApiRef();

  useEffect(() => {
    if (treeData.length > 0) {
      const allCategoryIds = treeData.map(c => `cat_${c.id}`);
      setExpanded(allCategoryIds);
    }
  }, [treeData]);

  const handleToggle = (_event: React.SyntheticEvent | null, itemIds: string[]) => {
    setExpanded(itemIds);
  };

  const handleItemClick = (event: React.SyntheticEvent, nodeId: string) => {
    // Only process the click if it's not on the expand/collapse icon
    if (!(event.target as HTMLElement).closest('.MuiTreeItem-iconContainer')) {
      const [type, idString] = nodeId.split('_');
      if (type && idString) {
        const id = parseInt(idString, 10);
        const isCategory = type === 'cat';
        
        // Special handling for special feeds (negative IDs)
        if (id < 0) {
          // For special feeds, we always set isCategory to false
          setSelection({ id, isCategory: false });
        } else {
          setSelection({ id, isCategory });
        }
      }
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
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

  return (
    <Box sx={{
      flexGrow: 1, 
      maxWidth: 400, 
      overflowY: 'auto',
      '& .MuiTreeItem-content': {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover'
        },
        // Make the entire content area non-clickable
        '&.MuiTreeItem-content': {
          pointerEvents: 'none'
        },
        // But make the icon container clickable
        '& .MuiTreeItem-iconContainer': {
          pointerEvents: 'auto',
          '&:hover': {
            backgroundColor: 'transparent'
          }
        },
        // Make the label clickable for selection
        '& .MuiTreeItem-label': {
          pointerEvents: 'auto',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          msUserSelect: 'none',
          MozUserSelect: 'none'
        }
      }
    }}>
      <SimpleTreeView
        apiRef={apiRef}
        aria-label="feed-navigator"
        selectedItems={selection ? `${selection.isCategory ? 'cat' : 'feed'}_${selection.id}` : null}
        expandedItems={expanded}
        onExpandedItemsChange={handleToggle}
        onItemClick={handleItemClick}
        slots={{ 
          collapseIcon: ExpandMoreIcon, 
          expandIcon: ChevronRightIcon,
        }}
      >
      {treeData.map((category) => (
        <TreeItem
          key={`cat_${category.id}`}
          itemId={`cat_${category.id}`}
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', p: 0.5, pr: 0 }}>
              <Typography sx={{ flexGrow: 1 }}>{category.title}</Typography>
            </Box>
          }
        >
          {category.feeds.map((feed) => {
            return (
              <TreeItem
                key={`feed_${feed.id}`}
                itemId={`feed_${feed.id}`}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', py: 0.5 }}>
                    {feed.muiIcon ? (
                      <Icon sx={{ width: 24, height: 24, mr: 1 }}>{feed.muiIcon}</Icon>
                    ) : feed.iconUrl ? (
                      <Avatar
                        src={feed.iconUrl}
                        sx={{ width: 24, height: 24, mr: 1, borderRadius: '2px' }}
                      />
                    ) : (
                      <Box sx={{ width: 24, height: 24, mr: 1 }} />
                    )}
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>{feed.title}</Typography>
                    <Badge badgeContent={feed.unread} color="primary" sx={{ mr: 2 }} />
                  </Box>
                }
              />
            );
          })}
        </TreeItem>
      ))}
      </SimpleTreeView>
    </Box>
  );

};

export default FeedTree;
