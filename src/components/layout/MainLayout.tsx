import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Drawer, Avatar, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ConfirmationDialog from '../ConfirmationDialog';
import SettingsIcon from '@mui/icons-material/Settings';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import FeedTree from '../FeedTree';
import ErrorBoundary from '../ErrorBoundary';
import { useSelection } from '../../contexts/SelectionContext';
import { useFeeds } from '../../hooks/useFeeds';
import { useHeadlinesContext } from '../../contexts/HeadlinesContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSettings } from '../../contexts/SettingsContext';

const drawerWidth = 240;

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCatchupDialogOpen, setCatchupDialogOpen] = useState(false);
  const { selection } = useSelection();
  const { treeData } = useFeeds();
  const { markFeedAsRead } = useHeadlinesContext();

  React.useEffect(() => {
    if (selection && mobileOpen) {
      setMobileOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection]);

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
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          ...(settings?.darkMode && {
            backgroundColor: 'primary.main',
            color: (theme) => theme.palette.getContrastText(theme.palette.primary.main),
          }),
        }}
      >
        <Toolbar>
          <Tooltip title={t('open_drawer_label')}>
            <IconButton
              color="inherit"
              aria-label={t('open_drawer_label') || 'open drawer'}
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
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
                {t('app_title')}
              </Typography>
            )}
          </Box>
          {selectedFeed && (
            <Tooltip title={t('mark_all_as_read_title')}>
              <IconButton color="inherit" onClick={() => setCatchupDialogOpen(true)}>
                <DoneAllIcon />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title={t('settings_title')}>
            <IconButton color="inherit" onClick={() => navigate('/settings')}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
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
      <ConfirmationDialog
        open={isCatchupDialogOpen}
        onClose={() => setCatchupDialogOpen(false)}
        onConfirm={() => {
          if (selection) {
            markFeedAsRead(selection.id, selection.isCategory);
          }
          setCatchupDialogOpen(false);
        }}
        title={t('mark_all_as_read_dialog_title')}
      >
        {t('mark_all_as_read_dialog_content')}
      </ConfirmationDialog>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
        }}
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
