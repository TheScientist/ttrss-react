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
  // Direction lock: null = undecided, 'horizontal' or 'vertical'
  const directionLock = useRef<null | 'horizontal' | 'vertical'>(null);
  const startXY = useRef<{ x: number; y: number } | null>(null);
  const { t } = useTranslation();
  const theme = useTheme();
  const [offsetX, setOffsetX] = useState(0);
  const itemRef = useRef<HTMLDivElement>(null);
  const swipedRef = useRef(false);
  const swiping = useRef(false);

  if (disabled) {
    // Return a simple div wrapper to maintain DOM structure without swipe functionality
    // or styles that interfere with sticky positioning.
    return <div>{children}</div>;
  }

  const handlers = useSwipeable({
    onTouchStartOrOnMouseDown: (e) => {
      // Type guard for TouchEvent
      if (typeof window !== 'undefined' && window.TouchEvent && e instanceof window.TouchEvent && e.touches.length > 0) {
        startXY.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (typeof window !== 'undefined' && window.MouseEvent && e instanceof window.MouseEvent) {
        startXY.current = { x: e.clientX, y: e.clientY };
      } else {
        startXY.current = null;
      }
      directionLock.current = null;
    },
    onSwiping: (eventData) => {
      // Use only deltaX/deltaY for direction lock
      if (directionLock.current === null) {
        const dx = Math.abs(eventData.deltaX);
        const dy = Math.abs(eventData.deltaY);
        if (dx > 10 || dy > 10) {
          directionLock.current = dx > dy ? 'horizontal' : 'vertical';
        }
      }
      if (directionLock.current === 'horizontal') {
        if (!swipedRef.current && (eventData.dir === 'Left' || eventData.dir === 'Right')) {
          if (Math.abs(eventData.deltaX) > 30) { // Require more horizontal movement
            swiping.current = true;
          }
          setOffsetX(eventData.deltaX);
        }
      }
    },
    onSwiped: (eventData) => {
      if (directionLock.current !== 'horizontal') return; // Only handle horizontal swipes
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

      setTimeout(() => {
        swiping.current = false;
        swipedRef.current = false;
        directionLock.current = null;
        startXY.current = null;
      }, 300);
    },
    trackMouse: true,
    trackTouch: true,
    preventScrollOnSwipe: false, // Let browser handle scroll
    delta: 10,
    rotationAngle: 15, // Stricter angle
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
      sx={{ position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}
      onClickCapture={handleClickCapture}
      onTouchStart={(e) => {
        swiping.current = false;
        swipedRef.current = false;
        directionLock.current = null;
        startXY.current = e.touches && e.touches.length > 0 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
      }}
      onTouchMove={(e) => {
        // Only preventDefault if locked to horizontal swipe
        if (directionLock.current === 'horizontal') {
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
