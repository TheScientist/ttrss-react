import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Drawer, Avatar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SettingsIcon from '@mui/icons-material/Settings';
import FeedTree from '../FeedTree';
import ErrorBoundary from '../ErrorBoundary';
import { useSelection } from '../../contexts/SelectionContext';
import { useFeeds } from '../../hooks/useFeeds';
import { useNavigate } from 'react-router-dom';

const drawerWidth = 240;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { selection } = useSelection();
  const { treeData } = useFeeds();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  // Get the selected feed/category info
  const getSelectedFeedInfo = () => {
    if (!selection || !treeData) return null;
    
    const { id, isCategory } = selection;
    
    if (isCategory) {
      const category = treeData.find(cat => cat.id === id);
      if (category) {
        return {
          title: category.title,
          iconUrl: undefined,
          muiIcon: 'folder'
        };
      }
    } else {
      // Search through all categories for the feed
      for (const category of treeData) {
        const feed = category.feeds.find(f => f.id === id);
        if (feed) {
          return {
            title: feed.title,
            iconUrl: feed.iconUrl,
            muiIcon: feed.muiIcon
          };
        }
      }
    }
    
    return null;
  };
  
  const selectedFeed = getSelectedFeedInfo();

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar />
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <ErrorBoundary>
          <FeedTree />
        </ErrorBoundary>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            {selectedFeed ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {selectedFeed.iconUrl ? (
                  <Avatar 
                    src={selectedFeed.iconUrl}
                    sx={{ 
                      width: 24, 
                      height: 24,
                      '& .MuiAvatar-img': {
                        objectFit: 'contain'
                      }
                    }}
                  />
                ) : selectedFeed.muiIcon ? (
                  <i 
                    className="material-icons" 
                    style={{ 
                      fontSize: '24px',
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    {selectedFeed.muiIcon}
                  </i>
                ) : null}
                <Typography variant="h6" noWrap component="div">
                  {selectedFeed.title}
                </Typography>
              </Box>
            ) : (
              <Typography variant="h6" noWrap component="div">
                Tiny Tiny RSS
              </Typography>
            )}
          </Box>
          <IconButton color="inherit" onClick={() => navigate('/settings')}>
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="mailbox folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </Box>
    </Box>
  );
};

export default MainLayout;
