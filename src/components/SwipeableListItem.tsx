import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSwipeable } from 'react-swipeable';
import { useTheme } from '@mui/material/styles';
import { Box, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

interface SwipeableListItemProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  disabled?: boolean;
  swipeThreshold?: number; // Percentage of screen width
}

const SwipeableListItem: React.FC<SwipeableListItemProps> = ({ children, onSwipeLeft, onSwipeRight, disabled = false, swipeThreshold = 20 }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const itemRef = useRef<HTMLDivElement>(null);
  const swipedRef = useRef(false);
  const swiping = useRef(false);

  if (disabled) {
    // Return a simple div wrapper to maintain DOM structure without swipe functionality
    // or styles that interfere with sticky positioning.
    return <div>{children}</div>;
  }

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      if (disabled) return;
      if (!swipedRef.current && (eventData.dir === 'Left' || eventData.dir === 'Right')) {
        if (Math.abs(eventData.deltaX) > 15) { // Slightly higher to avoid accidental triggers
          swiping.current = true;
          setIsSwiping(true);
        }
        setOffsetX(eventData.deltaX);
      }
    },
    onSwiped: (eventData) => {
      if (disabled) return;
      swipedRef.current = true;
      setOffsetX(0); // This will trigger the transition

      const threshold = (window.innerWidth * swipeThreshold) / 100;
      if (eventData.absX > threshold) {
        if (eventData.dir === 'Left') {
          onSwipeLeft?.();
        } else if (eventData.dir === 'Right') {
          onSwipeRight?.();
        }
      }

      // After a swipe, give a moment before resetting the swiping flag
      // to prevent the click event from firing.
      setTimeout(() => {
        swiping.current = false;
        swipedRef.current = false;
        setIsSwiping(false);
      }, 300); // Reset after transition duration
    },
    trackMouse: true,
    trackTouch: true,
    preventScrollOnSwipe: true,
    delta: 10,
    rotationAngle: 30,
    touchEventOptions: { passive: false },
  });

  const getBackgroundColor = () => {
    if (offsetX !== 0) return theme.palette.primary.main;
    return 'transparent';
  };

  const handleClickCapture = (e: React.MouseEvent) => {
    if (swiping.current) {
      e.stopPropagation();
    }
  };

  return (
    <Box
      {...handlers}
      sx={{ position: 'relative', overflow: 'hidden', touchAction: isSwiping ? 'none' : 'pan-y' }}
      onClickCapture={handleClickCapture}
      onTouchStart={() => {
        swiping.current = false;
        swipedRef.current = false;
        setIsSwiping(false);
      }}
      onTouchMove={(e) => {
        // While actively swiping horizontally, prevent vertical scrolling jank
        if (swiping.current) {
          e.preventDefault();
        }
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: getBackgroundColor(),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          color: theme.palette.common.white,
          zIndex: 0,
          transition: 'background-color 0.3s ease-out',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', opacity: offsetX > 0 ? 1 : 0 }}>
          <StarIcon sx={{ mr: 1 }} />
          <Typography variant="body2">{t('toggle_star')}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', opacity: offsetX < 0 ? 1 : 0 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>{t('toggle_read')}</Typography>
          <CheckCircleIcon />
        </Box>
      </Box>
      <Box
        {...handlers}
        ref={itemRef}
        sx={{
          transform: `translateX(${offsetX}px)`,
          position: 'relative',
          zIndex: 1,
          backgroundColor: theme.palette.background.paper,
          transition: swipedRef.current ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default SwipeableListItem;
