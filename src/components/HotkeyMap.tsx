import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { HOTKEY_GROUPS, HOTKEY_I18N_KEYS } from '../constants/hotkeys';
import { useTranslation } from 'react-i18next';

interface HotkeyMapProps {
  open: boolean;
  onClose: () => void;
}

const HotkeyMap: React.FC<HotkeyMapProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const { t } = useTranslation();

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('hotkey_reference_title')}</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {Object.values(HOTKEY_GROUPS).map((group) => (
          <Box key={group.titleKey} sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 1, fontWeight: 'bold' }}>
              {t(group.titleKey)}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'action.hover' }}>
                    <TableCell sx={{ fontWeight: 'bold', width: '20%' }}>{t('hotkey_reference_key')}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{t('hotkey_reference_action')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {group.keys.map((item) => (
                    <TableRow key={item.key}>
                      <TableCell>
                        <kbd style={{
                          padding: '2px 6px',
                          backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#f0f0f0',
                          color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                          border: `1px solid ${theme.palette.mode === 'dark' ? '#555555' : '#cccccc'}`,
                          borderRadius: '3px',
                          fontFamily: 'monospace',
                          fontSize: '0.85em',
                        }}>
                          {item.key.toUpperCase() === '?' ? '?' : item.key}
                        </kbd>
                      </TableCell>
                      <TableCell>{t(HOTKEY_I18N_KEYS[item.key])}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">
          {t('hotkey_reference_close_button')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HotkeyMap;
